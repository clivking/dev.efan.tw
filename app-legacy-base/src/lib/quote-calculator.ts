import { getSetting } from '@/lib/settings';
import {
    calculateItemSubtotal,
    calculateQuoteWithTaxExtraRate,
    type QuoteCalculation,
    type QuoteItemInput,
} from '@/lib/quote-calculator-core';

export async function calculateQuote(
    items: QuoteItemInput[],
    discountAmount: number,
    taxRate: number,
    transportFee: number = 0,
    transportFeeCost: number = 0
): Promise<QuoteCalculation> {
    const taxExtraRate = Number(await getSetting('tax_extra_rate', 3));
    return calculateQuoteWithTaxExtraRate(items, discountAmount, taxRate, transportFee, transportFeeCost, taxExtraRate);
}

export { calculateItemSubtotal, calculateQuoteWithTaxExtraRate };
export type { QuoteCalculation, QuoteItemInput };
