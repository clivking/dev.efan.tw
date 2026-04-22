import { Prisma } from '@/generated/prisma-v7/client';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { fireAndForgetNotification } from '@/lib/notifications/telegram';
import { getConfiguredSiteOrigin } from '@/lib/site-url';

export async function checkLoginAllowance(params: {
    username: string;
    clientIp: string | null;
    authType: string;
}): Promise<{ blocked: boolean; retryAfterMinutes: number; failureCount: number }> {
    const windowMinutes = await getSetting('security_login_failure_window_minutes', 15);
    const attemptLimit = await getSetting('security_login_failure_attempt_limit', 5);
    const lockMinutes = await getSetting('security_login_lock_minutes', 30);

    const ipClause = params.clientIp
        ? Prisma.sql`OR ip_address = ${params.clientIp}`
        : Prisma.empty;

    const rows = await prisma.$queryRaw<Array<{ count: bigint; last_failed_at: Date | null }>>`
        SELECT COUNT(*)::bigint AS count, MAX(created_at) AS last_failed_at
        FROM audit_logs
        WHERE action = 'login_failed'
          AND created_at >= now() - (${windowMinutes} * interval '1 minute')
          AND (after->>'authType') = ${params.authType}
          AND (
            (after->>'attemptedUsername') = ${params.username}
            ${ipClause}
          )
    `;

    const failureCount = Number(rows[0]?.count ?? BigInt(0));
    const lastFailedAt = rows[0]?.last_failed_at;
    const blocked = failureCount >= attemptLimit
        && !!lastFailedAt
        && Date.now() - new Date(lastFailedAt).getTime() < lockMinutes * 60 * 1000;

    return { blocked, retryAfterMinutes: lockMinutes, failureCount };
}

export async function maybeNotifyFailedLoginBurst(params: {
    username: string;
    clientIp: string | null;
    authType: string;
    failureCount: number;
}): Promise<void> {
    const enabled = await getSetting('security_alert_failed_login_burst', true);
    const threshold = await getSetting('security_failed_login_burst_threshold', 5);
    if (!enabled || params.failureCount !== threshold) return;

    const baseUrl = getConfiguredSiteOrigin();
    const lines = [
        '🚨 <b>登入失敗異常</b>',
        '',
        `來源：${params.authType}`,
        `帳號：${params.username}`,
        `IP：${params.clientIp || '未知'}`,
        `累積失敗次數：${params.failureCount}`,
        '',
        `<a href="${baseUrl}/admin/settings#audit">查看安全稽核</a>`,
    ];

    void fireAndForgetNotification(lines.join('\n'), {
        type: 'security',
        entityType: 'auth',
        chatIdSettingKey: 'telegram_chat_id',
    });
}

export async function maybeNotifyLoginRisk(params: {
    userId: string;
    username: string;
    clientIp: string | null;
    authType: string;
    offHours: boolean;
}): Promise<void> {
    const [alertNewIp, alertOffHours] = await Promise.all([
        getSetting('security_alert_new_ip_login', true),
        getSetting('security_alert_off_hours_login', true),
    ]);

    const newIp = params.clientIp
        ? await isFirstSuccessfulIpLogin(params.userId, params.clientIp, params.authType)
        : false;

    if ((!newIp || !alertNewIp) && (!params.offHours || !alertOffHours)) return;

    const baseUrl = getConfiguredSiteOrigin();
    const reasons = [
        newIp && alertNewIp ? '新 IP 登入' : null,
        params.offHours && alertOffHours ? '離峰時段登入' : null,
    ].filter(Boolean).join(' / ');

    const lines = [
        '⚠️ <b>管理登入提醒</b>',
        '',
        `帳號：${params.username}`,
        `來源：${params.authType}`,
        `IP：${params.clientIp || '未知'}`,
        `原因：${reasons}`,
        '',
        `<a href="${baseUrl}/admin/settings#audit">查看安全稽核</a>`,
    ];

    void fireAndForgetNotification(lines.join('\n'), {
        type: 'security',
        entityType: 'auth',
        chatIdSettingKey: 'telegram_chat_id',
    });
}

export async function isOffHours(date: Date = new Date()): Promise<boolean> {
    const [start, end] = await Promise.all([
        getSetting('security_off_hours_start', '22:00'),
        getSetting('security_off_hours_end', '06:00'),
    ]);

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);

    if (startMinutes === endMinutes) return false;
    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

async function isFirstSuccessfulIpLogin(userId: string, ipAddress: string, authType: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM audit_logs
        WHERE user_id = ${userId}::uuid
          AND action = 'login'
          AND table_name = 'auth'
          AND ip_address = ${ipAddress}
          AND (after->>'authType') = ${authType}
    `;

    return Number(rows[0]?.count ?? BigInt(0)) <= 1;
}

function toMinutes(value: string): number {
    const [hour, minute] = value.split(':').map((part) => Number(part));
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
    return hour * 60 + minute;
}
