export interface QuoteItemInput {
    quantity: number;
    unitPrice: number;
    costPrice: number;
}

export interface QuoteCalculation {
    subtotalAmount: number;
    totalAmount: number;
    totalCost: number;
    totalProfit: number;
    taxCost: number;
    actualProfit: number;
}

export function calculateQuoteWithTaxExtraRate(
    items: QuoteItemInput[],
    discountAmount: number,
    taxRate: number,
    transportFee: number = 0,
    transportFeeCost: number = 0,
    taxExtraRate: number = 3
): QuoteCalculation {
    const subtotalAmount = Math.round(
        items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0)
    );
    const totalAmount = Math.round(subtotalAmount - Number(discountAmount) + Number(transportFee));
    const totalCost = Math.round(
        items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.costPrice), 0) + Number(transportFeeCost)
    );
    const totalProfit = Math.round(totalAmount - totalCost);

    let taxCost = 0;
    let actualProfit = totalProfit;

    if (Number(taxRate) > 0) {
        taxCost = Math.round(totalAmount * (Number(taxRate) + taxExtraRate) / 100);
        actualProfit = Math.round(totalProfit - taxCost);
    }

    return {
        subtotalAmount,
        totalAmount,
        totalCost,
        totalProfit,
        taxCost,
        actualProfit,
    };
}

export function calculateItemSubtotal(quantity: number, unitPrice: number): number {
    return Math.round(Number(quantity) * Number(unitPrice));
}
