import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { canDirectEdit } from '@/lib/quote-status';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 批次更新排序
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const { items } = body; // Expecting [{ id: 'uuid', sortOrder: 0 }, ...]

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
        }

        const quote = await prisma.quote.findUnique({ where: { id } });
        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (!canDirectEdit(quote.status as any)) {
            return NextResponse.json({ error: 'Confirmed quotes cannot be edited directly.' }, { status: 403 });
        }

        await prisma.$transaction(
            items.map((item: { id: string, sortOrder: number }) =>
                prisma.quoteItem.update({
                    where: { id: item.id, quoteId: id },
                    data: { sortOrder: item.sortOrder }
                })
            )
        );

        return NextResponse.json({ success: true });
    });
}
