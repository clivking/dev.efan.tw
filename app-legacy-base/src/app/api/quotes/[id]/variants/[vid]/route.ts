import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { recalculateQuoteAmounts } from '@/lib/recalculateQuoteAmounts';
import { resolveQuoteId } from '@/lib/resolveQuoteId';

/**
 * PUT /api/quotes/[id]/variants/[vid]
 * 修改方案名稱、推薦狀態或排序
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, vid: string }> }
) {
    try {
        const { id: rawId, vid } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        const body = await request.json();
        const { name, isRecommended, sortOrder } = body;

        // 1. 更新此方案
        await prisma.$transaction(async (tx) => {
            // 如果設為推薦，其他方案取消推薦
            if (isRecommended === true) {
                await tx.quoteVariant.updateMany({
                    where: { quoteId: id },
                    data: { isRecommended: false },
                });
            }

            await tx.quoteVariant.update({
                where: { id: vid },
                data: {
                    ...(name !== undefined && { name }),
                    ...(isRecommended !== undefined && { isRecommended }),
                    ...(sortOrder !== undefined && { sortOrder }),
                },
            });
        });

        // 2. 重新計算主表金額（主表要跟著推薦方案走）
        await recalculateQuoteAmounts(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating variant:', error);
        return NextResponse.json({ error: 'server_error', message: '伺服器錯誤' }, { status: 500 });
    }
}

/**
 * DELETE /api/quotes/[id]/variants/[vid]
 * 刪除方案
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, vid: string }> }
) {
    try {
        const { id: rawId, vid } = await params;
        const id = await resolveQuoteId(rawId);
        if (!id) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

        // 1. 執行刪除（方案專屬品項會一併刪除）
        await prisma.$transaction(async (tx) => {
            // 刪除專屬品項
            await tx.quoteItem.deleteMany({
                where: { variantId: vid }
            });

            // 刪除方案
            const deletedVariant = await tx.quoteVariant.delete({
                where: { id: vid }
            });

            // 如果刪掉的是推薦方案，且還有其他方案，將第一個設為推薦
            if (deletedVariant.isRecommended) {
                const firstRemaining = await tx.quoteVariant.findFirst({
                    where: { quoteId: id },
                    orderBy: { sortOrder: 'asc' }
                });
                if (firstRemaining) {
                    await tx.quoteVariant.update({
                        where: { id: firstRemaining.id },
                        data: { isRecommended: true }
                    });
                }
            }
        });

        // 2. 重新計算主表金額
        await recalculateQuoteAmounts(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting variant:', error);
        return NextResponse.json({ error: 'server_error', message: '伺服器錯誤' }, { status: 500 });
    }
}
