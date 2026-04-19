import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { normalizeIpAddress, parseIpList } from '@/lib/ip';
import { sendTelegramNotification, formatQuoteMessage } from '@/lib/notifications/telegram';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // Parse body for userAgent and deviceType
        const body = await request.json().catch(() => ({}));
        const userAgent = body.userAgent || request.headers.get('user-agent') || '';
        const deviceType = body.deviceType || 'unknown';

        // 1. Verify token
        const quoteToken = await prisma.quoteToken.findUnique({
            where: { token },
            include: {
                quote: {
                    include: {
                        customer: {
                            include: {
                                companyNames: { where: { isPrimary: true }, take: 1 },
                                contacts: { where: { isPrimary: true }, take: 1 },
                            }
                        }
                    }
                },
            },
        });

        if (!quoteToken || quoteToken.quote.isDeleted) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }

        if (!quoteToken.isActive || (quoteToken.expiresAt && quoteToken.expiresAt < new Date())) {
            return NextResponse.json({ error: 'invalid_token' }, { status: 410 });
        }

        const validStatusesForPublic = ['sent', 'signed', 'construction', 'completed', 'paid'];
        if (!validStatusesForPublic.includes(quoteToken.quote.status)) {
            return NextResponse.json({ error: 'not_ready' }, { status: 403 });
        }

        // 2. Check setting `enable_view_tracking`
        const isTrackingEnabled = await getSetting('enable_view_tracking', true);
        if (!isTrackingEnabled) {
            // Return a dummy ID if tracking is disabled
            return NextResponse.json({ viewId: 'tracking-disabled' });
        }

        // Get IP
        const ipAddressRaw = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
        const clientIp = normalizeIpAddress(ipAddressRaw);

        // 3. Check for exclusion (IP or Cookie)
        // a. Check Cookie
        const noTrackCookie = request.cookies.get('efan_admin_no_track');
        if (noTrackCookie?.value === 'yes') {
            return NextResponse.json({ viewId: 'admin-ignored' });
        }

        // b. Check IP Exclusion List (Manual + Dynamic)
        const [manualExcludedIps, dynamicExcludedIps] = await Promise.all([
            getSetting('exclude_view_tracking_ips', ''),
            getSetting('dynamic_admin_ips', '')
        ]);

        const excludedIpList = [
            ...parseIpList(manualExcludedIps),
            ...parseIpList(dynamicExcludedIps),
        ];

        if (excludedIpList.includes(clientIp)) {
            return NextResponse.json({ viewId: 'ip-ignored' });
        }

        // 4. Create quote_views record
        const viewRecord = await prisma.quoteView.create({
            data: {
                tokenId: quoteToken.id,
                ipAddress: clientIp,
                userAgent,
                deviceType,
            },
        });

        // 4. Update quotes table
        const isFirstView = !quoteToken.quote.firstViewedAt;
        await prisma.quote.update({
            where: { id: quoteToken.quoteId },
            data: {
                viewCount: { increment: 1 },
                firstViewedAt: isFirstView ? new Date() : undefined,
            },
        });

        // 5. Send Telegram notification (First view only, fire-and-forget)
        if (isFirstView) {
            const enableViewNotify = await getSetting('enable_quote_viewed_notification', true);
            if (enableViewNotify) {
                const q = quoteToken.quote;
                const customerName = q.customer?.companyNames[0]?.companyName || q.customer?.contacts[0]?.name || '未知客戶';
                const message = formatQuoteMessage('viewed', {
                    id: quoteToken.quoteId,
                    quoteNumber: q.quoteNumber,
                    customerName: customerName
                });
                await sendTelegramNotification(message, { type: 'quote_viewed', entityType: 'quotes', entityId: q.id });
            }
        }

        return NextResponse.json({ viewId: viewRecord.id });

    } catch (error) {
        console.error('Error tracking quote view:', error);
        return NextResponse.json(
            { error: 'internal_server_error' },
            { status: 500 }
        );
    }
}
