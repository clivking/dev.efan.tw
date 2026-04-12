import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

import { recalculateQuoteAmounts } from '@/lib/recalculateQuoteAmounts';

import { getSetting } from '@/lib/settings';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * GET /api/quotes/[id]/variants
 * 列出報價單的所有方案
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                variants: {
                    orderBy: { sortOrder: 'asc' },
                },
                items: true,
            },
        });

        if (!quote) {
            return NextResponse.json({ error: 'not_found', message: '報價單不存在' }, { status: 404 });
        }

        const sharedItems = quote.items.filter(i => !i.variantId);

        return NextResponse.json({
            variants: quote.variants,
            sharedItemCount: sharedItems.length,
            discount: {
                amount: quote.discountAmount,
                note: quote.discountNote,
            }
        });
    } catch (error) {
        console.error('Error fetching variants:', error);
        return NextResponse.json({ error: 'server_error', message: '伺服器錯誤' }, { status: 500 });
    }
}

/**
 * POST /api/quotes/[id]/variants
 * 新增方案
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: rawId } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'missing_name', message: '請提供方案名稱' }, { status: 400 });
        }

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { variants: true },
        });

        if (!quote) {
            return NextResponse.json({ error: 'not_found', message: '報價單不存在' }, { status: 404 });
        }

        // 1. 檢查上限
        const maxVariants = Number(await getSetting('max_quote_variants', '5'));
        if (quote.variants.length >= maxVariants) {
            return NextResponse.json({
                error: 'limit_reached',
                message: `方案數量已達上限 (${maxVariants})`
            }, { status: 400 });
        }

        // 2. 建立方案
        const isFirst = quote.variants.length === 0;
        const variant = await prisma.quoteVariant.create({
            data: {
                quoteId: id,
                name,
                isRecommended: isFirst, // 第一個自動設為推薦
                sortOrder: quote.variants.length,
            },
        });

        // 3. 重新計算金額
        await recalculateQuoteAmounts(id);

        return NextResponse.json({ variant });
    } catch (error) {
        console.error('Error creating variant:', error);
        return NextResponse.json({ error: 'server_error', message: '伺服器錯誤' }, { status: 500 });
    }
}
