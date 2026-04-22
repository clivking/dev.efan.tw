type LogLike = {
    action: string;
    tableName: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
};

export type AuditCategory = 'security' | 'business' | 'system' | 'public';
export type AuditSeverity = 'info' | 'warning' | 'critical';

const SECURITY_ACTIONS = new Set([
    'login',
    'login_failed',
    'logout',
    'password_changed',
    'session_revoked',
    'role_change',
]);

const SECURITY_TABLES = new Set(['auth', 'auth_sessions', 'users']);
const BUSINESS_TABLES = new Set([
    'customers',
    'contacts',
    'locations',
    'company_names',
    'quotes',
    'quote_items',
    'products',
    'product_categories',
    'payments',
    'templates',
    'guides',
    'pages',
]);

const PUBLIC_TABLES = new Set([
    'contact_requests',
    'public_quote_request',
    'public_inquiry',
    'portal_auth',
]);

const SECURITY_SETTING_KEYS = new Set([
    'telegram_bot_token',
    'telegram_chat_id',
    'telegram_chat_id_customer_service',
    'turnstile_secret_key',
    'turnstile_site_key',
    'security_login_failure_window_minutes',
    'security_login_failure_attempt_limit',
    'security_login_lock_minutes',
    'security_alert_new_ip_login',
    'security_alert_failed_login_burst',
    'security_failed_login_burst_threshold',
    'security_alert_off_hours_login',
    'security_off_hours_start',
    'security_off_hours_end',
    'security_session_days',
    'audit_retention_security_days',
    'audit_retention_general_days',
]);

export function isSecurityAuditLog(log: LogLike): boolean {
    if (SECURITY_ACTIONS.has(log.action) || SECURITY_TABLES.has(log.tableName)) return true;

    if (log.tableName === 'settings') {
        const key = getSettingKey(log);
        return key ? SECURITY_SETTING_KEYS.has(key) : false;
    }

    return false;
}

export function classifyAuditCategory(log: LogLike): AuditCategory {
    if (isSecurityAuditLog(log)) return 'security';
    if (PUBLIC_TABLES.has(log.tableName)) return 'public';
    if (BUSINESS_TABLES.has(log.tableName)) return 'business';
    return 'system';
}

export function classifyAuditSeverity(log: LogLike): AuditSeverity {
    if (log.action === 'login_failed') return 'warning';
    if (log.action === 'role_change' || log.action === 'password_changed') return 'critical';
    if (log.action === 'session_revoked') return 'warning';
    if (log.tableName === 'users' && (log.action === 'delete' || log.action === 'status_change')) return 'critical';
    if (log.tableName === 'settings' && isSecurityAuditLog(log)) return 'critical';
    if (log.action === 'delete') return 'warning';
    return 'info';
}

export function summarizeAudit(log: LogLike): string {
    const key = getSettingKey(log);
    const attemptedUsername = typeof log.after?.attemptedUsername === 'string' ? log.after.attemptedUsername : null;
    const username = typeof log.after?.username === 'string' ? log.after.username : null;
    const authType = typeof log.after?.authType === 'string' ? log.after.authType : null;
    const revokedScope = typeof log.after?.scope === 'string' ? log.after.scope : null;

    switch (log.action) {
        case 'login_failed':
            return `登入失敗${attemptedUsername ? `：${attemptedUsername}` : ''}${authType ? ` (${authType})` : ''}`;
        case 'login':
            return `登入成功${username ? `：${username}` : ''}${authType ? ` (${authType})` : ''}`;
        case 'logout':
            return `登出${username ? `：${username}` : ''}`;
        case 'password_changed':
            return '密碼已變更';
        case 'role_change':
            return '權限角色已變更';
        case 'session_revoked':
            return `Session 已撤銷${revokedScope ? ` (${revokedScope})` : ''}`;
        default:
            if (log.tableName === 'settings' && key) return `設定變更：${key}`;
            return `${log.tableName} / ${log.action}`;
    }
}

function getSettingKey(log: LogLike): string | null {
    const afterKey = typeof log.after?.key === 'string' ? log.after.key : null;
    if (afterKey) return afterKey;
    const beforeKey = typeof log.before?.key === 'string' ? log.before.key : null;
    return beforeKey;
}
