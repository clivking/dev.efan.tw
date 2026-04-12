import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';

/**
 * 金額重算核心函式 (Phase 9 - 多方案版)
 * 每次 items 或 variants 變更時呼叫。
 * 採整單統一折扣 (Unified Discount) 邏輯。
 *
 * Design note (TOCTOU tradeoff):
 * Reads are performed outside the transaction, calculations happen in JS,
 * and only the final writes are wrapped in $transaction. This minimizes
 * DB lock duration for better concurrency. In the unlikely event that items
 * are modified between read and write by a concurrent request, the totals
 * may be briefly stale until the next recalculation. This is acceptable
 * for this low-concurrency admin scenario (few operators editing quotes).
 */
export async function recalculateQuoteAmounts(quoteId: string) {
    // ═══ Phase 1: Read (outside transaction — no locks held) ═══
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            items: true,
            variants: { orderBy: { sortOrder: 'asc' } },
        },
    });

    if (!quote) return;

    const variants = quote.variants;
    const hasVariants = variants.length > 0;
    const discountAmount = Number(quote.discountAmount);
    const transportFee = quote.hasTransportFee ? Number(quote.transportFee || 0) : 0;
    const transportFeeCost = quote.hasTransportFee ? Number(quote.transportFeeCost || 0) : 0;
    const taxRate = Number(quote.taxRate);
    const taxExtraRate = Number(await getSetting('tax_extra_rate', '3'));

    if (!hasVariants) {
        // ═══ 傳統模式：與第一輪行為相同 ═══
        // Phase 2: Calculate (in JS — no DB interaction)
        const allItems = quote.items;
        const subtotal = allItems.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
        const totalCost = allItems.reduce((sum, i) => sum + i.quantity * Number(i.costPrice), 0) + transportFeeCost;

        // 總報價 = 小計 - 折扣 + 車馬費
        const totalAmount = subtotal - discountAmount + transportFee;

        // 只有在有開發票 (taxRate > 0) 的情況下，才計算 5% 營業稅與 3% 內部稅務成本
        const effectiveTaxExtraRate = taxRate > 0 ? taxExtraRate : 0;
        // tax_cost = total_amount × (tax_rate + effectiveTaxExtraRate) / 100
        const taxCost = Math.round(totalAmount * (taxRate + effectiveTaxExtraRate) / 100);
        const totalProfit = Math.round(totalAmount - totalCost);
        const actualProfit = Math.round(totalProfit - Math.round(totalAmount * effectiveTaxExtraRate / 100));

        // Phase 3: Write (inside transaction)
        await prisma.quote.update({
            where: { id: quoteId },
            data: {
                subtotalAmount: Math.round(subtotal),
                totalAmount: Math.round(totalAmount),
                totalCost: Math.round(totalCost),
                totalProfit,
                taxCost,
                actualProfit,
            },
        });
        return;
    }

    // ═══ 多方案模式 (V2: 統一折扣) ═══

    // Phase 2: Calculate all variant totals (in JS)
    const sharedItems = quote.items.filter(i => !i.variantId);
    const sharedSubtotal = sharedItems.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
    const sharedCost = sharedItems.reduce((sum, i) => sum + i.quantity * Number(i.costPrice), 0);

    const variantUpdates = variants.map(variant => {
        const variantItems = quote.items.filter(i => i.variantId === variant.id);
        const variantSubtotal = variantItems.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
        const variantCost = variantItems.reduce((sum, i) => sum + i.quantity * Number(i.costPrice), 0);

        const subtotalAmount = Math.round(sharedSubtotal + variantSubtotal);
        const totalAmount = Math.round(subtotalAmount - discountAmount + transportFee);
        const totalCost = Math.round(sharedCost + variantCost + transportFeeCost);

        return {
            id: variant.id,
            subtotalAmount,
            totalAmount,
            totalCost,
        };
    });

    // Determine which variant drives the quote-level totals
    const recommendedVariant = variantUpdates.find(v => v.id === quote.selectedVariantId)
        || variantUpdates.find(v => variants.find(vr => vr.id === v.id)?.isRecommended)
        || variantUpdates[0];

    const effectiveTaxExtraRate = taxRate > 0 ? taxExtraRate : 0;
    const taxCost = Math.round(recommendedVariant.totalAmount * (taxRate + effectiveTaxExtraRate) / 100);
    const totalProfit = Math.round(recommendedVariant.totalAmount - recommendedVariant.totalCost);
    const actualProfit = Math.round(totalProfit - Math.round(recommendedVariant.totalAmount * effectiveTaxExtraRate / 100));

    // Phase 3: Write all updates inside a single transaction
    await prisma.$transaction([
        // Update all variants in parallel (batched)
        ...variantUpdates.map(vu =>
            prisma.quoteVariant.update({
                where: { id: vu.id },
                data: {
                    subtotalAmount: vu.subtotalAmount,
                    totalAmount: vu.totalAmount,
                    totalCost: vu.totalCost,
                },
            })
        ),
        // Update quote-level totals
        prisma.quote.update({
            where: { id: quoteId },
            data: {
                subtotalAmount: recommendedVariant.subtotalAmount,
                totalAmount: recommendedVariant.totalAmount,
                totalCost: recommendedVariant.totalCost,
                totalProfit,
                taxCost,
                actualProfit,
            },
        }),
    ]);
}
