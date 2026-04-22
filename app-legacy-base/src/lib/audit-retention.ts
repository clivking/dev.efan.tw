import { prisma } from '@/lib/prisma';
import { getSetting, setSetting } from '@/lib/settings';
import { cleanupExpiredAuthSessions } from '@/lib/auth-sessions';

export async function runAuditRetentionIfDue(force = false): Promise<{ deletedSecurity: number; deletedGeneral: number; deletedSessions: number }> {
    const lastRunAt = await getSetting('audit_retention_last_run_at', '');
    const lastRunMs = lastRunAt ? new Date(lastRunAt).getTime() : 0;
    if (!force && lastRunMs && Date.now() - lastRunMs < 24 * 60 * 60 * 1000) {
        return { deletedSecurity: 0, deletedGeneral: 0, deletedSessions: 0 };
    }

    const [securityDays, generalDays] = await Promise.all([
        getSetting('audit_retention_security_days', 365),
        getSetting('audit_retention_general_days', 180),
    ]);

    const securityRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        WITH deleted AS (
            DELETE FROM audit_logs
            WHERE created_at < now() - (${securityDays} * interval '1 day')
              AND (
                action IN ('login', 'login_failed', 'logout', 'password_changed', 'session_revoked', 'role_change')
                OR table_name IN ('auth', 'auth_sessions', 'users', 'settings')
              )
            RETURNING 1
        )
        SELECT COUNT(*)::bigint AS count FROM deleted
    `;

    const generalRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        WITH deleted AS (
            DELETE FROM audit_logs
            WHERE created_at < now() - (${generalDays} * interval '1 day')
              AND NOT (
                action IN ('login', 'login_failed', 'logout', 'password_changed', 'session_revoked', 'role_change')
                OR table_name IN ('auth', 'auth_sessions', 'users', 'settings')
              )
            RETURNING 1
        )
        SELECT COUNT(*)::bigint AS count FROM deleted
    `;

    const deletedSessions = await cleanupExpiredAuthSessions();
    await setSetting('audit_retention_last_run_at', new Date().toISOString(), 'string');

    return {
        deletedSecurity: Number(securityRows[0]?.count ?? BigInt(0)),
        deletedGeneral: Number(generalRows[0]?.count ?? BigInt(0)),
        deletedSessions,
    };
}
