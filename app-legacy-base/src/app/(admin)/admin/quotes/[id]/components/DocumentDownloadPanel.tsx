'use client';

import React from 'react';

interface DocumentDownloadPanelProps {
    quoteId: string;
    status: string;
    completedAt?: string | null;
    paymentCount?: number;
    latestPaymentId?: string | null;
}

export default function DocumentDownloadPanel({
    quoteId,
    status,
    completedAt,
    paymentCount = 0,
    latestPaymentId = null,
}: DocumentDownloadPanelProps) {
    const isSignedAbove = ['signed', 'construction', 'completed', 'paid'].includes(status);
    const isCompletedAbove = ['completed', 'paid'].includes(status);
    const receiptUrl = latestPaymentId
        ? `/api/quotes/${quoteId}/receipt-pdf?paymentId=${latestPaymentId}`
        : `/api/quotes/${quoteId}/receipt-pdf`;

    const documents = [
        {
            name: '報價單 PDF',
            url: `/api/quotes/${quoteId}/pdf`,
            enabled: true,
            hint: '',
        },
        {
            name: '出貨單 PDF',
            url: `/api/quotes/${quoteId}/delivery-pdf`,
            enabled: isSignedAbove,
            hint: !isSignedAbove ? '案件需已簽回後才能下載。' : '',
        },
        {
            name: '請款單 PDF',
            url: `/api/quotes/${quoteId}/invoice-pdf`,
            enabled: isSignedAbove,
            hint: !isSignedAbove ? '案件需已簽回後才能下載。' : '',
        },
        {
            name: paymentCount > 1 ? '收據 PDF（最新一筆）' : '收據 PDF',
            url: receiptUrl,
            enabled: true,
            hint: '',
        },
        {
            name: '保固書 PDF',
            url: `/api/quotes/${quoteId}/warranty-pdf`,
            enabled: Boolean(isCompletedAbove && completedAt),
            hint: !isCompletedAbove
                ? '案件需已完工後才能下載。'
                : (!completedAt ? '請先填寫完工日期。' : ''),
        },
    ];

    return (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">文件下載</h3>
            <div className="space-y-2">
                {documents.map((doc) => (
                    <div key={doc.name} className="group flex items-center justify-between rounded-2xl border border-gray-50 p-3 transition-colors hover:bg-gray-50">
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold ${doc.enabled ? 'text-gray-700' : 'text-gray-300'}`}>{doc.name}</span>
                            {doc.hint && <span className="text-[10px] font-bold text-orange-400">{doc.hint}</span>}
                        </div>
                        {doc.enabled ? (
                            <button
                                onClick={() => window.open(doc.url, '_blank')}
                                className="rounded-xl bg-indigo-50 px-4 py-1.5 text-xs font-black text-indigo-600 shadow-sm transition-all hover:bg-indigo-600 hover:text-white active:scale-95"
                            >
                                開啟
                            </button>
                        ) : (
                            <div className="cursor-not-allowed rounded-xl bg-gray-50 px-4 py-1.5 text-xs font-black text-gray-300">
                                未開放
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
