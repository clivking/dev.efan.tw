import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { resolveQuoteId } from '@/lib/resolveQuoteId';
import { getOriginFromRequest } from '@/lib/site-url';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const { id: rawId } = await context.params;
            const id = await resolveQuoteId(rawId);
            if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

            const quote = await prisma.quote.findUnique({
                where: { id },
                include: {
                    tokens: {
                        include: {
                            views: {
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                    },
                },
            });

            if (!quote || quote.isDeleted) {
                return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
            }

            // Get active token
            const activeToken = quote.tokens.find(t => t.isActive);
            let activeTokenData = null;
            if (activeToken) {
                const baseUrl = getOriginFromRequest(request);
                activeTokenData = {
                    token: activeToken.token,
                    url: `${baseUrl}/q/${activeToken.token}`,
                    isActive: activeToken.isActive,
                    createdAt: activeToken.createdAt,
                };
            }

            // Combine all views across all tokens for this quote
            const allViews = quote.tokens.flatMap(t => t.views).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Compute summary
            let totalDuration = 0;
            const devices = { mobile: 0, desktop: 0, tablet: 0 };
            const viewsList = allViews.map(view => {
                // Accumulate for summary
                totalDuration += (view.durationSeconds || 0);
                const dt = view.deviceType?.toLowerCase();
                if (dt === 'mobile' || dt === 'tablet') {
                    devices[dt]++;
                } else {
                    devices['desktop']++;
                }

                return {
                    id: view.id,
                    createdAt: view.createdAt.toISOString(),
                    deviceType: view.deviceType || 'unknown',
                    durationSeconds: view.durationSeconds || 0,
                    ipAddress: view.ipAddress || 'unknown',
                };
            });

            const summary = {
                totalViews: allViews.length,
                firstViewedAt: quote.firstViewedAt ? quote.firstViewedAt.toISOString() : null,
                lastViewedAt: allViews.length > 0 ? allViews[0].createdAt.toISOString() : null,
                averageDuration: allViews.length > 0 ? Math.round(totalDuration / allViews.length) : 0,
                devices,
            };

            return NextResponse.json({
                summary,
                views: viewsList,
                token: activeTokenData,
            });
        } catch (error) {
            console.error('Error fetching quote views:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    });
}
