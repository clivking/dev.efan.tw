'use client';

interface QuoteAlertsSectionProps {
    requiresInvoice: boolean;
    showInvoiceReminder: boolean;
    showPaymentReminder: boolean;
}

export default function QuoteAlertsSection({
    requiresInvoice,
    showInvoiceReminder,
    showPaymentReminder,
}: QuoteAlertsSectionProps) {
    if (!showInvoiceReminder && !showPaymentReminder && requiresInvoice) {
        return null;
    }

    return (
        <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-4 md:px-8">
            <div className="flex flex-wrap gap-3">
                {!requiresInvoice && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        本案為 0% 稅率，不需開立發票。
                    </div>
                )}
                {showInvoiceReminder && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                        已施工且為 5% 稅率，但尚未填寫開票日期。
                    </div>
                )}
                {showPaymentReminder && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                        案件已完工，請確認是否已收款與開票。
                    </div>
                )}
            </div>
        </div>
    );
}
