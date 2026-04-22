import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserDetailed, signToken } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { getSetting, setSetting } from '@/lib/settings';
import { parseIpList } from '@/lib/ip';
import { getClientIp, getClientUserAgent } from '@/lib/request-metadata';
import { SYSTEM_USER_ID } from '@/lib/system-user';
import { createAuthSession } from '@/lib/auth-sessions';
import { checkLoginAllowance, isOffHours, maybeNotifyFailedLoginBurst, maybeNotifyLoginRisk } from '@/lib/login-guard';
import { runAuditRetentionIfDue } from '@/lib/audit-retention';
import { ensureSecuritySettings } from '@/lib/security-settings';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    noStore();
    const body = await request.json();
    const { username, password } = body;
    const clientIp = getClientIp(request);
    const userAgent = getClientUserAgent(request);

    await ensureSecuritySettings();
    void runAuditRetentionIfDue().catch(console.error);

    if (!username || !password) {
        return NextResponse.json(
            { error: '請輸入帳號與密碼' },
            { status: 400 }
        );
    }

    const allowance = await checkLoginAllowance({ username, clientIp, authType: 'admin' });
    if (allowance.blocked) {
        return NextResponse.json(
            { error: `登入失敗次數過多，請於 ${allowance.retryAfterMinutes} 分鐘後再試` },
            { status: 429 }
        );
    }

    const authResult = await authenticateUserDetailed(username, password);
    if (!authResult.ok) {
        await writeAudit({
            userId: SYSTEM_USER_ID,
            action: 'login_failed',
            tableName: 'auth',
            recordId: SYSTEM_USER_ID,
            after: {
                authType: 'admin',
                attemptedUsername: username,
                reason: authResult.reason,
                failureCount: allowance.failureCount + 1,
                userAgent,
            },
            ipAddress: clientIp,
        });
        await maybeNotifyFailedLoginBurst({
            username,
            clientIp,
            authType: 'admin',
            failureCount: allowance.failureCount + 1,
        });

        return NextResponse.json(
            { error: '帳號或密碼錯誤' },
            { status: 401 }
        );
    }

    const { user } = authResult;
    const sessionId = await createAuthSession(user.id, request);
    const token = await signToken({ userId: user.id, role: user.role, sessionId });
    const offHours = await isOffHours();
    await writeAudit({
        userId: user.id,
        action: 'login',
        tableName: 'auth',
        recordId: user.id,
        after: {
            authType: 'admin',
            username: user.username,
            role: user.role,
            sessionId,
            offHours,
            userAgent,
        },
        ipAddress: clientIp,
    });
    await maybeNotifyLoginRisk({
        userId: user.id,
        username: user.username,
        clientIp,
        authType: 'admin',
        offHours,
    });

    const response = NextResponse.json({ user });
    
    // Set Cookies
    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });

    // Also set the permanent no-track cookie for the tracking API
    response.cookies.set('efan_admin_no_track', 'yes', {
        httpOnly: false, // Must be readable by other parts of application or just for identification
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
    });

    // Automatically record this IP into the dynamic exclusion list
    try {
        if (clientIp) {
            const currentList = await getSetting('dynamic_admin_ips', '');
            const ipList = parseIpList(currentList);

            if (!ipList.includes(clientIp)) {
                // Keep a longer rolling window so previous admin IPs do not
                // quickly fall out of the exclusion list.
                const newList = [clientIp, ...ipList].slice(0, 100);
                await setSetting('dynamic_admin_ips', newList.join(','), 'string');
            }
        }
    } catch (e) {
        console.error('Failed to update dynamic admin IPs:', e);
    }

    return response;
}
