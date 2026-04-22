import { prisma } from '@/lib/prisma';

export const SECURITY_SETTING_DEFAULTS = [
    { key: 'security_login_failure_window_minutes', value: '15', type: 'number', category: 'security', description: '登入失敗計算時間窗（分鐘）' },
    { key: 'security_login_failure_attempt_limit', value: '5', type: 'number', category: 'security', description: '同帳號或 IP 在時間窗內最多允許失敗次數' },
    { key: 'security_login_lock_minutes', value: '30', type: 'number', category: 'security', description: '超過登入失敗次數後的暫時鎖定分鐘數' },
    { key: 'security_alert_new_ip_login', value: 'true', type: 'boolean', category: 'security', description: '新 IP 登入時發送 Telegram 告警' },
    { key: 'security_alert_failed_login_burst', value: 'true', type: 'boolean', category: 'security', description: '短時間大量登入失敗時發送 Telegram 告警' },
    { key: 'security_failed_login_burst_threshold', value: '5', type: 'number', category: 'security', description: '短時間登入失敗告警門檻' },
    { key: 'security_alert_off_hours_login', value: 'true', type: 'boolean', category: 'security', description: '離峰時段登入時發送 Telegram 告警' },
    { key: 'security_off_hours_start', value: '22:00', type: 'string', category: 'security', description: '離峰時段開始時間（24 小時制）' },
    { key: 'security_off_hours_end', value: '06:00', type: 'string', category: 'security', description: '離峰時段結束時間（24 小時制）' },
    { key: 'security_session_days', value: '30', type: 'number', category: 'security', description: '管理後台登入 session 保留天數' },
    { key: 'audit_retention_security_days', value: '365', type: 'number', category: 'security', description: '安全稽核紀錄保留天數' },
    { key: 'audit_retention_general_days', value: '180', type: 'number', category: 'security', description: '一般稽核紀錄保留天數' },
    { key: 'audit_retention_last_run_at', value: '', type: 'string', category: 'security', description: '最近一次稽核清理時間（系統維護用）' },
] as const;

let ensureSecuritySettingsPromise: Promise<void> | null = null;

export async function ensureSecuritySettings(): Promise<void> {
    if (!ensureSecuritySettingsPromise) {
        ensureSecuritySettingsPromise = prisma.$transaction(
            SECURITY_SETTING_DEFAULTS.map((setting) =>
                prisma.setting.upsert({
                    where: { key: setting.key },
                    update: {
                        description: setting.description,
                        category: setting.category,
                        type: setting.type,
                    },
                    create: setting,
                }),
            ),
        ).then(() => undefined).finally(() => {
            ensureSecuritySettingsPromise = null;
        });
    }

    await ensureSecuritySettingsPromise;
}
