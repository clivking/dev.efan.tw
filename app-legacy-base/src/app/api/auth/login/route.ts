import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateUser, signToken } from '@/lib/auth';
import { getSetting, setSetting } from '@/lib/settings';
import { normalizeIpAddress, parseIpList } from '@/lib/ip';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    noStore();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
        return NextResponse.json(
            { error: '請輸入帳號與密碼' },
            { status: 400 }
        );
    }

    const user = await authenticateUser(username, password);
    if (!user) {
        return NextResponse.json(
            { error: '帳號或密碼錯誤' },
            { status: 401 }
        );
    }

    const token = await signToken({ userId: user.id, role: user.role });

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
        const ipAddressRaw = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
        const clientIp = normalizeIpAddress(ipAddressRaw);

        if (clientIp !== 'unknown') {
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
