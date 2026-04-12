'use client';

import MoneyDisplay from './MoneyDisplay';

interface QuoteSummaryProps {
    subtotalAmount: number;
    discountAmount: number;
    transportFee?: number;
    totalAmount: number;
    totalCost: number;
    totalProfit: number;
    taxRate: number;
    taxCost: number;
    actualProfit: number;
}

export default function QuoteSummary({
    subtotalAmount,
    discountAmount,
    transportFee = 0,
    totalAmount,
    totalCost,
    totalProfit,
    taxRate,
    taxCost,
    actualProfit
}: QuoteSummaryProps) {
    const vatAmount = taxRate === 5 ? Math.round(totalAmount * 0.05) : 0;
    const internalTaxAmount = taxRate === 5 ? Math.round(totalAmount * 0.08) : 0;
    const grandTotal = totalAmount + vatAmount;

    return (
        <div className="space-y-6 w-full max-w-sm">
            <div className="text-right border-b-2 border-efan-primary/20 pb-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">總計 (含稅)</div>
                <div className="text-4xl font-black text-efan-primary">
                    <MoneyDisplay amount={grandTotal} />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-400 font-bold">
                    <span>應收小計 (未稅)</span>
                    <MoneyDisplay amount={totalAmount} className="text-gray-600" />
                </div>
                {taxRate > 0 && (
                    <div className="flex justify-between text-sm text-gray-400 font-bold">
                        <span>營業稅 (5%)</span>
                        <MoneyDisplay amount={vatAmount} className="text-gray-600" />
                    </div>
                )}

                <div className="pt-4 mt-2 border-t border-dashed border-gray-200">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">【 內部支出分析 】</div>
                    <div className="flex justify-between text-sm text-gray-400 font-bold">
                        <span>設備與工程成本</span>
                        <MoneyDisplay amount={totalCost} className="text-gray-600" />
                    </div>
                    {internalTaxAmount > 0 && (
                        <div className="flex justify-between text-sm text-red-300 font-bold mt-2">
                            <span>內部管銷與稅務 (8%)</span>
                            <MoneyDisplay amount={internalTaxAmount} prefix="-$" className="text-red-400" />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center bg-green-50/50 p-4 rounded-2xl border border-green-100 mt-6 shadow-sm">
                    <span className="font-black text-gray-700 text-base">預計獲利金額</span>
                    <MoneyDisplay amount={actualProfit} className="text-green-600 text-2xl font-black" />
                </div>
            </div>
        </div>
    );
}
