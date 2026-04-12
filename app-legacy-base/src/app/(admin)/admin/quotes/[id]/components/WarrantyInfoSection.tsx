'use client';

import WarrantyBadge from '@/components/WarrantyBadge';

interface WarrantyInfoSectionProps {
    quote: {
        warrantyStartDate: string | null;
        warrantyMonths: number | null;
        warrantyExpiresAt: string | null;
    };
    warrantyStatus: 'none' | 'no_warranty' | 'active' | 'expired';
    remainingDays: number | null;
    onChangeWarrantyStartDate: (value: string | null) => void;
    onChangeWarrantyMonths: (value: number) => void;
}

export default function WarrantyInfoSection({
    quote,
    warrantyStatus,
    remainingDays,
    onChangeWarrantyStartDate,
    onChangeWarrantyMonths,
}: WarrantyInfoSectionProps) {
    const computeExpiresAt = (start: string | null, months: number | null) => {
        if (!start) return null;
        const d = new Date(start);
        d.setMonth(d.getMonth() + (months ?? 12));
        return d.toISOString().slice(0, 10);
    };

    const expiresAt = quote.warrantyExpiresAt
        ? new Date(quote.warrantyExpiresAt).toLocaleDateString('zh-TW')
        : (quote.warrantyStartDate ? computeExpiresAt(quote.warrantyStartDate, quote.warrantyMonths) : '未設定');

    return (
        <div className="border-b border-gray-100 p-4 md:p-8">
            <div className="max-w-4xl space-y-4">
                <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        保固資訊
                    </label>
                    <WarrantyBadge quote={quote as any} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">保固起始日</label>
                        <input
                            type="date"
                            max="9999-12-31"
                            value={quote.warrantyStartDate ? new Date(quote.warrantyStartDate).toISOString().slice(0, 10) : ''}
                            onChange={(e) => onChangeWarrantyStartDate(e.target.value || null)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-teal-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">保固月數</label>
                        <input
                            type="number"
                            min="0"
                            max="120"
                            value={quote.warrantyMonths ?? 12}
                            onChange={(e) => onChangeWarrantyMonths(Number(e.target.value))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-teal-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">保固到期日</label>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-500">
                            {expiresAt}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">保固狀態</label>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-bold">
                            {warrantyStatus === 'active' && <span className="text-green-600">保固中，剩 {remainingDays} 天</span>}
                            {warrantyStatus === 'expired' && <span className="text-red-600">已過保</span>}
                            {warrantyStatus === 'no_warranty' && <span className="text-gray-500">無保固</span>}
                            {warrantyStatus === 'none' && <span className="text-gray-400">未設定</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
