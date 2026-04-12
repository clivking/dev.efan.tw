import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { getSetting } from '@/lib/settings';

// 3 requests per minute per IP
const checkRateLimit = createRateLimiter(3, 60_000);

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const clientIp = typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown';

        // Layer 0: Rate limiting
        if (!checkRateLimit(clientIp)) {
            return NextResponse.json(
                { error: '提交過於頻繁，請稍後再試' },
                { status: 429 }
            );
        }

        const body = await request.json();

        // Layer 1: Honeypot
        if (body.website) {
            // Bot detected — return fake success
            return NextResponse.json({ success: true, id: 'RECEIVED' });
        }

        // Layer 2: Turnstile
        const turnstileEnabled = await getSetting('turnstile_enabled', true);
        if (turnstileEnabled) {
            const isValid = await verifyTurnstile(body.turnstileToken);
            if (!isValid) {
                return NextResponse.json({ error: '驗證失敗，請重試' }, { status: 403 });
            }
        }

        // Layer 3: Validate required fields
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const details = typeof body.details === 'string' ? body.details.trim() : '';

        if (!name || !phone || !email) {
            return NextResponse.json(
                { error: '姓名、電話與電子郵件為必填欄位' },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: '請填寫有效的電子郵件地址' },
                { status: 400 }
            );
        }

        const newRequest = await prisma.contactRequest.create({
            data: {
                name,
                phone,
                email,
                details: details || null,
                services: [],
                ipAddress: clientIp,
                status: 'new'
            },
        });

        return NextResponse.json({ success: true, id: newRequest.id });
    } catch (error) {
        console.error('Failed to save contact request:', error);
        return NextResponse.json(
            { error: '提交失敗，請稍後再試或直接撥打電話聯繫我們' },
            { status: 500 }
        );
    }
}
