import { NextRequest, NextResponse } from 'next/server';
import { authenticatePortalUser, signPortalToken, setPortalCookie } from '@/lib/portal-auth';
import { authenticateUser } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { SYSTEM_USER_ID } from '@/lib/system-user';
import { getClientIp, getClientUserAgent } from '@/lib/request-metadata';
import { checkLoginAllowance, maybeNotifyFailedLoginBurst } from '@/lib/login-guard';
import { runAuditRetentionIfDue } from '@/lib/audit-retention';
import { ensureSecuritySettings } from '@/lib/security-settings';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();
        const clientIp = getClientIp(req);
        const userAgent = getClientUserAgent(req);

        await ensureSecuritySettings();
        void runAuditRetentionIfDue().catch(console.error);

        if (!username || !password) {
            return NextResponse.json({ error: '請輸入帳號和密碼' }, { status: 400 });
        }

        const allowance = await checkLoginAllowance({ username, clientIp, authType: 'portal' });
        if (allowance.blocked) {
            return NextResponse.json({ error: `登入失敗次數過多，請於 ${allowance.retryAfterMinutes} 分鐘後再試` }, { status: 429 });
        }

        // 1. Try portal user (customer) login first
        const result = await authenticatePortalUser(username, password);

        if (result && 'error' in result && result.error === 'disabled') {
            return NextResponse.json({ error: '您的帳號已被停用，請聯繫一帆安全' }, { status: 403 });
        }

        if (result && 'user' in result) {
            const { user } = result;
            const token = await signPortalToken({
                portalUserId: user.id,
                customerId: user.customerId,
                username: user.username,
            });

            await setPortalCookie(token);
            await writeAudit({
                userId: SYSTEM_USER_ID,
                action: 'login',
                tableName: 'portal_auth',
                recordId: SYSTEM_USER_ID,
                after: {
                    authType: 'portal',
                    portalUserId: user.id,
                    username: user.username,
                    userAgent,
                },
                ipAddress: clientIp,
            });

            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    companyName: user.customer.companyNames[0]?.companyName || '',
                },
            });
        }

        // 2. Fallback: try admin user login
        const adminUser = await authenticateUser(username, password);
        if (adminUser) {
            const token = await signPortalToken({
                portalUserId: adminUser.id,
                customerId: '',
                username: adminUser.username,
                isAdmin: true,
            });

            await setPortalCookie(token);
            await writeAudit({
                userId: adminUser.id,
                action: 'login',
                tableName: 'portal_auth',
                recordId: adminUser.id,
                after: {
                    authType: 'portal_admin',
                    username: adminUser.username,
                    role: adminUser.role,
                    userAgent,
                },
                ipAddress: clientIp,
            });

            return NextResponse.json({
                success: true,
                user: {
                    id: adminUser.id,
                    username: adminUser.username,
                    displayName: adminUser.name || '管理員',
                    companyName: '一帆安全整合（管理員）',
                    isAdmin: true,
                },
            });
        }

        await writeAudit({
            userId: SYSTEM_USER_ID,
            action: 'login_failed',
            tableName: 'portal_auth',
            recordId: SYSTEM_USER_ID,
            after: {
                authType: 'portal',
                attemptedUsername: username,
                reason: 'invalid_credentials',
                failureCount: allowance.failureCount + 1,
                userAgent,
            },
            ipAddress: clientIp,
        });
        await maybeNotifyFailedLoginBurst({
            username,
            clientIp,
            authType: 'portal',
            failureCount: allowance.failureCount + 1,
        });

        return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    } catch (error) {
        console.error('[Portal Login]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}
