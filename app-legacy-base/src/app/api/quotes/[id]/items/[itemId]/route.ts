import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { calculateQuote, calculateItemSubtotal } from '@/lib/quote-calculator';
import { canDirectEdit } from '@/lib/quote-status';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 修改明細
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string, itemId: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId, itemId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const { name, description, unit, quantity, unitPrice, costPrice, isHiddenItem, internalNote, customerNote, variantId } = body;

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (!canDirectEdit(quote.status as any)) {
            return NextResponse.json({ error: 'Confirmed quotes cannot be edited directly.' }, { status: 403 });
        }

        const before = await prisma.quoteItem.findUnique({ where: { id: itemId, quoteId: id } });
        if (!before) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const subtotal = calculateItemSubtotal(quantity ?? Number(before.quantity), unitPrice ?? Number(before.unitPrice));

        const updatedItem = await prisma.$transaction(async (tx) => {
            const resultItem = await tx.quoteItem.update({
                where: { id: itemId },
                data: {
                    name,
                    description,
                    unit,
                    quantity,
                    unitPrice,
                    costPrice,
                    isHiddenItem,
                    internalNote,
                    customerNote,
                    subtotal,
                    variantId: variantId !== undefined ? (variantId || null) : undefined
                },
            });

            // 重新計算整張報價單金額 (Phase 9 使用共用函式)
            return resultItem;
        });

        // 異步交易外執行金額重算
        const { recalculateQuoteAmounts } = await import('@/lib/recalculateQuoteAmounts');
        await recalculateQuoteAmounts(id);

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'quote_items',
            recordId: itemId,
            before: before as any,
            after: updatedItem as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(updatedItem);
    });
}

/**
 * 刪除明細
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string, itemId: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId, itemId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (!canDirectEdit(quote.status as any)) {
            return NextResponse.json({ error: 'Confirmed quotes cannot be edited directly.' }, { status: 403 });
        }

        const before = await prisma.quoteItem.findUnique({ where: { id: itemId, quoteId: id } });
        if (!before) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.quoteItem.delete({ where: { id: itemId } });
            // 金額重算在交易外執行
        });

        // 異步交易外執行金額重算
        const { recalculateQuoteAmounts } = await import('@/lib/recalculateQuoteAmounts');
        await recalculateQuoteAmounts(id);

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'quote_items',
            recordId: itemId,
            before: before as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
