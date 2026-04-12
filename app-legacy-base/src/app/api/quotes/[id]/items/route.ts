import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

import { writeAudit } from '@/lib/audit';

import { calculateQuote, calculateItemSubtotal } from '@/lib/quote-calculator';

import { canDirectEdit } from '@/lib/quote-status';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * 列出明細
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const items = await prisma.quoteItem.findMany({
            where: { quoteId: id },
            orderBy: { sortOrder: 'asc' }
        });
        return NextResponse.json({ items });
    });
}

/**
 * 新增明細（從產品帶入或手動）
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const { productId, quantity = 1, priceMode = 'selling', name, description, unit, unitPrice, costPrice, isHiddenItem, variantId } = body;

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

        // 排序：基於該方案或共用（Phase 9 簡化為全局排序，或可按 variant 排序，此處維持全局遞增）
        const maxSortOrderItem = await prisma.quoteItem.findFirst({
            where: { quoteId: id },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true }
        });
        const sortOrder = (maxSortOrderItem?.sortOrder ?? -1) + 1;

        let itemData: any = {
            quoteId: id,
            variantId: variantId || null,
            quantity,
            sortOrder,
        };

        if (productId) {
            // 模式 A：從產品帶入
            const product = await prisma.product.findUnique({ where: { id: productId } });
            if (!product || product.isDeleted) {
                return NextResponse.json({ error: 'Product not found or deleted' }, { status: 404 });
            }

            itemData = {
                ...itemData,
                productId,
                name: product.quoteName || product.name,
                description: product.quoteDesc || product.description,
                unit: product.unit,
                unitPrice: priceMode === 'repair' ? product.repairPrice : product.sellingPrice,
                costPrice: product.costPrice,
                isHiddenItem: product.isHiddenItem,
                subtotal: calculateItemSubtotal(quantity, Number(priceMode === 'repair' ? product.repairPrice : product.sellingPrice))
            };
        } else {
            // 模式 B：手動新增
            if (!name || unitPrice === undefined || costPrice === undefined) {
                return NextResponse.json({ error: 'Missing required fields for manual item' }, { status: 400 });
            }
            itemData = {
                ...itemData,
                name,
                description,
                unit,
                unitPrice,
                costPrice,
                isHiddenItem: isHiddenItem || false,
                subtotal: calculateItemSubtotal(quantity, unitPrice)
            };
        }

        const result = await prisma.$transaction(async (tx) => {
            const newItem = await tx.quoteItem.create({ data: itemData });

            // 重新計算整張報價單金額 (Phase 9 使用共用函式)
            return newItem;
        });

        // 異步交易外執行金額重算，確保資料已寫入
        const { recalculateQuoteAmounts } = await import('@/lib/recalculateQuoteAmounts');
        await recalculateQuoteAmounts(id);

        await writeAudit({
            userId: req.user!.id,
            action: 'create',
            tableName: 'quote_items',
            recordId: result.id,
            after: result as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(result);
    });
}
