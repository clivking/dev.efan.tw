'use client';

interface InvoiceInfoSectionProps {
    requiresInvoice: boolean;
    invoiceIssued: boolean;
    invoiceIssuedAt: string | null;
    onChangeInvoiceIssuedAt: (value: string | null) => void;
}

export default function InvoiceInfoSection({
    requiresInvoice,
    invoiceIssued,
    invoiceIssuedAt,
    onChangeInvoiceIssuedAt,
}: InvoiceInfoSectionProps) {
    return (
        <div className="border-b border-gray-100 bg-rose-50/10 p-4 md:p-8">
            <div className="max-w-4xl space-y-4">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${requiresInvoice ? (invoiceIssued ? 'bg-rose-500' : 'bg-amber-400') : 'bg-emerald-400'}`} />
                        發票資訊
                    </label>
                    <div className={`rounded-full px-3 py-1 text-[11px] font-black ${requiresInvoice ? (invoiceIssued ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600') : 'bg-emerald-100 text-emerald-600'}`}>
                        {requiresInvoice ? (invoiceIssued ? '已開發票' : '待開發票') : '免開發票'}
                    </div>
                </div>

                {!requiresInvoice ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        本案為 0% 稅率，無需開立發票。
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-rose-100/60 bg-white/70 p-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-rose-400">開票日期</label>
                            <input
                                type="date"
                                value={invoiceIssuedAt ? invoiceIssuedAt.split('T')[0] : ''}
                                onChange={(e) => onChangeInvoiceIssuedAt(e.target.value || null)}
                                max="9999-12-31"
                                className="w-full rounded-xl border border-rose-100 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-rose-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">發票狀態</label>
                            <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${invoiceIssued ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                {invoiceIssued ? '已開發票' : '尚未開票'}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">提醒</label>
                            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600">
                                清空開票日期即視為未開發票，儀錶板會自動列入提醒。
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
