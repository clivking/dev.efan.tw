import { NextRequest, NextResponse } from 'next/server';
import { authenticatePortalUser, signPortalToken, setPortalCookie } from '@/lib/portal-auth';
import { authenticateUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: '請輸入帳號和密碼' }, { status: 400 });
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

        return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    } catch (error) {
        console.error('[Portal Login]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}

