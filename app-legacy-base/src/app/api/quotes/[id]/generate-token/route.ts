import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { writeAudit } from '@/lib/audit';
import { resolveQuoteId } from '@/lib/resolveQuoteId';
import { getOriginFromRequest } from '@/lib/site-url';


export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const { id: rawId } = await context.params;
            const id = await resolveQuoteId(rawId);
            if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
            const userId = req.user!.id;

            // 1. Verify quote exists
            const quote = await prisma.quote.findFirst({
                where: {
                    id,
                    isDeleted: false,
                },
            });

            if (!quote) {
                return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
            }

            // 2. Deactivate old tokens
            await prisma.quoteToken.updateMany({
                where: { quoteId: id, isActive: true },
                data: { isActive: false },
            });

            // 3. Generate nanoid
            const { nanoid } = await import('nanoid');
            const tokenStr = nanoid(12);

            // 4. Create new token
            const newToken = await prisma.quoteToken.create({
                data: {
                    quoteId: id,
                    token: tokenStr,
                    isActive: true,
                    createdBy: userId,
                },
            });

            // 5. Audit log
            await writeAudit({
                userId,
                action: 'update' as any,
                tableName: 'quotes',
                recordId: id,
                after: { tokenId: newToken.id, token: tokenStr },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            // Determine base URL
            const baseUrl = getOriginFromRequest(request);

            return NextResponse.json({
                token: newToken.token,
                url: `${baseUrl}/q/${newToken.token}`,
                createdAt: newToken.createdAt,
            });
        } catch (error) {
            console.error('Error generating quote token:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    });
}
