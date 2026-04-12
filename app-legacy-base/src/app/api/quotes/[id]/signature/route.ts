import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { withAuth } from '@/lib/middleware/auth';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        try {
            const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

            const signature = await prisma.quoteSignature.findFirst({
                where: { quoteId: id },
                orderBy: { createdAt: 'desc' },
            });

            if (!signature) {
                return NextResponse.json({ signature: null });
            }

            return NextResponse.json({
                signature: {
                    ...signature,
                    signatureImage: `/api/quotes/${id}/signature/${signature.id}`,
                },
            });

        } catch (error) {
            console.error('Error fetching admin signature:', error);
            return NextResponse.json({ error: 'internal_error' }, { status: 500 });
        }
    });
}
