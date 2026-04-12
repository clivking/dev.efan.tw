'use client';

import React from 'react';
import { toast } from 'sonner';
import QuoteStatusBadge from '@/components/admin/quotes/QuoteStatusBadge';
import EnableVariantsButton from './EnableVariantsButton';

interface QuoteHeaderSectionProps {
    quote: any;
    isDraft: boolean;
    saving: boolean;
    hasUnsavedChanges: boolean;
    cloning: boolean;
    savingTemplate: boolean;
    updateQuote: (patch: Record<string, any>) => void;
    onChangeStatus: (status: string) => void;
    onOpenPicker: () => void;
    onClone: () => void;
    onSaveAsTemplate: () => void;
    onRefresh: () => void;
    viewData: any;
    onRefreshViews: () => void;
    onManualSave: () => void;
    onBack: () => void;
    onViewCustomer: () => void;
    onEditCustomer: () => void;
}

const QuoteHeaderSection = React.memo(function QuoteHeaderSection({
    quote,
    isDraft,
    saving,
    hasUnsavedChanges,
    cloning,
    savingTemplate,
    updateQuote,
    onChangeStatus,
    onOpenPicker,
    onClone,
    onSaveAsTemplate,
    onRefresh,
    viewData,
    onRefreshViews,
    onManualSave,
    onBack,
    onViewCustomer,
    onEditCustomer,
}: QuoteHeaderSectionProps) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const handleCopyLink = async () => {
        if (!viewData?.token?.url) {
            if (!window.confirm('此報價單尚未產生檢視連結，是否現在產生？')) return;
            try {
                const res = await fetch(`/api/quotes/${quote.id}/generate-token`, { method: 'POST' });
                if (res.ok) {
                    onRefreshViews();
                    setCopied(true);
                    toast.success('連結已產生並複製');
                }
            } catch {
                toast.error('產生失敗');
            }
            return;
        }

        navigator.clipboard.writeText(viewData.token.url);
        setCopied(true);
        toast.success('連結已複製');
        setTimeout(() => setCopied(false), 2000);
    };

    const isSignedAbove = ['signed', 'construction', 'completed', 'paid'].includes(quote.status);
    const isCompletedAbove = ['completed', 'paid'].includes(quote.status);
    const documents = [
        { name: '出貨單', icon: '📦', url: `/api/quotes/${quote.id}/delivery-pdf`, enabled: isSignedAbove },
        { name: '請款單', icon: '💰', url: `/api/quotes/${quote.id}/invoice-pdf`, enabled: isSignedAbove },
        { name: '保固書', icon: '🔧', url: `/api/quotes/${quote.id}/warranty-pdf`, enabled: isCompletedAbove && quote.completedAt },
    ];

    return (
        <div className="flex flex-col gap-0 border-b border-gray-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 px-4 py-4 md:px-8 md:py-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    {!quote.variants?.length && isDraft && (
                        <EnableVariantsButton quoteId={quote.id} onEnabled={onRefresh} />
                    )}

                    {!isDraft && (
                        <div className="mr-2 flex flex-wrap items-center gap-2 sm:mr-2 sm:border-r sm:border-gray-200 sm:pr-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">目前狀態</span>
                            <select
                                value={quote.status}
                                onChange={(e) => onChangeStatus(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-black text-gray-700 shadow-sm focus:ring-2 focus:ring-efan-primary"
                            >
                                <option value="draft">📁 草稿</option>
                                <option value="confirmed">✅ 已確認</option>
                                <option value="sent">📨 已發送</option>
                                <option value="signed">✍️ 已回簽</option>
                                <option value="construction">🏗️ 施工中</option>
                                <option value="completed">🏆 已完工</option>
                                <option value="paid">💰 已付款</option>
                                <option value="closed">🚫 作廢</option>
                            </select>
                            {['sent', 'signed', 'construction', 'completed', 'paid'].includes(quote.status) && (
                                <button
                                    onClick={handleCopyLink}
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-all ${copied ? 'border-green-200 bg-green-50 text-green-600' : 'border-gray-200 bg-white text-indigo-600 hover:bg-indigo-50'}`}
                                    title="複製客戶檢視連結"
                                >
                                    {copied ? '✓' : '🔗'}
                                </button>
                            )}
                        </div>
                    )}

                    {isDraft ? (
                        <button
                            onClick={() => {
                                if (window.confirm('確定要將此報價單確認為「內部確認無誤」嗎？確認後將無法隨意編輯。')) {
                                    onChangeStatus('confirmed');
                                }
                            }}
                            className="rounded-xl bg-efan-primary px-5 py-2 text-sm font-bold text-white shadow-md shadow-efan-primary/20 transition-all hover:scale-105 active:scale-95"
                        >
                            🚀 確認發布
                        </button>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50"
                                >
                                    📥 相關文件
                                </button>
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                        <div className="animate-in fade-in slide-in-from-top-2 absolute left-0 top-full z-20 mt-2 w-52 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl duration-200">
                                            {documents.map((doc) => (
                                                <button
                                                    key={doc.url}
                                                    disabled={!doc.enabled}
                                                    onClick={() => {
                                                        window.open(doc.url, '_blank');
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold transition-colors ${doc.enabled ? 'text-gray-700 hover:bg-gray-50' : 'pointer-events-none bg-gray-50/50 text-gray-300 grayscale'}`}
                                                >
                                                    <span className="text-lg">{doc.icon}</span>
                                                    <div className="flex flex-col">
                                                        <span>{doc.name}</span>
                                                        {!doc.enabled && <span className="text-[10px] font-medium text-orange-300">尚未達到階段</span>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-black text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                    >
                        📄 下載 PDF
                    </button>
                    <button
                        onClick={onClone}
                        disabled={cloning}
                        className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-black text-indigo-600 shadow-sm transition-all hover:bg-indigo-50 ${cloning ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        📋 複製
                    </button>
                    <button
                        onClick={onSaveAsTemplate}
                        disabled={savingTemplate}
                        className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-black text-amber-600 shadow-sm transition-all hover:bg-amber-50 ${savingTemplate ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        📌 儲存模板
                    </button>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                    <button
                        onClick={onManualSave}
                        disabled={saving || !hasUnsavedChanges}
                        data-testid="quote-save-button"
                        className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all sm:py-2 ${(saving || !hasUnsavedChanges) ? 'cursor-not-allowed bg-green-100 text-green-600' : 'bg-green-600 text-white shadow-md shadow-green-100 hover:bg-green-700'}`}
                    >
                        {saving ? <><span className="animate-spin">⌛</span> 儲存中...</> : hasUnsavedChanges ? <>💾 儲存變更</> : <>✓ 已同步</>}
                    </button>
                    <button
                        onClick={onBack}
                        className="rounded-xl bg-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-300 sm:py-2"
                    >
                        返回列表
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 divide-gray-100 lg:grid-cols-2 lg:divide-x">
                <div className="space-y-4 p-4 md:p-8">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <h1 className="text-2xl font-black tracking-tight text-gray-800">{quote.quoteNumber}</h1>
                        <QuoteStatusBadge status={quote.status} />
                        {quote.status !== 'draft' && (
                            <button
                                onClick={() => onChangeStatus('draft')}
                                className="rounded-lg bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-all hover:bg-orange-50 hover:text-orange-500"
                            >
                                ↩ 重設
                            </button>
                        )}
                        {saving && <span className="animate-pulse text-xs text-gray-400">儲存中...</span>}
                        {!saving && hasUnsavedChanges && <span className="text-xs text-amber-500">尚有未儲存變更</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">報價單名稱</label>
                        {isDraft ? (
                            <div className="space-y-2">
                                <input
                                    value={quote.name ?? ''}
                                    onChange={(e) => updateQuote({ name: e.target.value })}
                                    placeholder="請輸入報價名稱（中文）"
                                    className="w-full rounded-xl border-none bg-gray-50 px-4 py-2 text-lg font-bold focus:ring-2 focus:ring-efan-primary"
                                />
                                <input
                                    value={quote.nameEn ?? ''}
                                    onChange={(e) => updateQuote({ nameEn: e.target.value })}
                                    placeholder="英文標題（選填）"
                                    className="w-full rounded-xl border-none bg-gray-50/50 px-4 py-1.5 text-sm font-bold text-gray-500 focus:ring-2 focus:ring-efan-primary/50"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <h2 className="text-lg font-bold text-gray-700">{quote.name || '(未命名報價)'}</h2>
                                {quote.nameEn && <span className="text-sm font-medium text-gray-400">{quote.nameEn}</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 bg-gray-50/30 p-4 md:p-8">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-lg text-gray-400">🏢</span>
                            {isDraft ? (
                                <select
                                    value={quote.companyNameId || ''}
                                    onChange={(e) => updateQuote({ companyNameId: e.target.value || null })}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-efan-primary"
                                >
                                    <option value="">無公司抬頭</option>
                                    {quote.customer?.companyNames?.map((cn: any) => (
                                        <option key={cn.id} value={cn.id}>{cn.companyName}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="font-bold text-gray-700">{quote.companyName?.companyName || '無公司抬頭'}</span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-start gap-3">
                            <span className="mt-1 text-lg text-gray-400">👤</span>
                            {isDraft ? (
                                <>
                                    <div className="flex min-h-[42px] flex-1 flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
                                        {quote.contacts?.map((qc: any) => (
                                            <span key={qc.contact.id} className="inline-flex items-center gap-1 rounded-lg border border-efan-primary/10 bg-efan-primary/5 px-3 py-1 text-xs font-black text-efan-primary">
                                                {qc.contact.name}
                                                <button
                                                    onClick={() => {
                                                        const newCids = quote.contacts
                                                            .filter((x: any) => x.contact.id !== qc.contact.id)
                                                            .map((x: any) => x.contact.id);
                                                        updateQuote({ contactIds: newCids });
                                                    }}
                                                    className="ml-1 text-efan-primary/40 transition-colors hover:text-red-500"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                        <select
                                            className="h-7 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-gray-400 focus:ring-0"
                                            value=""
                                            onChange={(e) => {
                                                const cid = e.target.value;
                                                if (!cid) return;
                                                const currentCids = quote.contacts?.map((qc: any) => qc.contact.id) || [];
                                                if (!currentCids.includes(cid)) updateQuote({ contactIds: [...currentCids, cid] });
                                            }}
                                        >
                                            <option value="">+ 新增聯絡人</option>
                                            {quote.customer?.contacts?.filter((c: any) => !quote.contacts?.some((qc: any) => qc.contact.id === c.id)).map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name} {c.mobile}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {quote.customerId && (
                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={onViewCustomer}
                                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                                            >
                                                查看客戶
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onEditCustomer}
                                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-efan-primary shadow-sm transition-all hover:bg-gray-50"
                                            >
                                                編輯客戶
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex flex-wrap gap-3">
                                        {quote.contacts?.map((qc: any) => (
                                            <span key={qc.contact.id} className="font-bold text-gray-700">{qc.contact.name} {qc.contact.mobile}</span>
                                        ))}
                                        {(!quote.contacts || quote.contacts.length === 0) && <span className="italic text-gray-400">無聯絡人</span>}
                                    </div>
                                    {quote.customerId && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={onViewCustomer}
                                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                                            >
                                                查看客戶
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onEditCustomer}
                                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-efan-primary shadow-sm transition-all hover:bg-gray-50"
                                            >
                                                編輯客戶
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-lg text-gray-400">📍</span>
                            {isDraft ? (
                                <div className="flex flex-1 gap-2">
                                    <select
                                        value={quote.locationId || ''}
                                        onChange={(e) => updateQuote({ locationId: e.target.value || null })}
                                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-efan-primary"
                                    >
                                        <option value="">無地址</option>
                                        {quote.customer?.locations?.map((location: any) => (
                                            <option key={location.id} value={location.id}>{location.name}: {location.address}</option>
                                        ))}
                                    </select>
                                    <div className="shrink-0">
                                        <button
                                            onClick={onOpenPicker}
                                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-black text-efan-primary shadow-sm transition-all hover:bg-gray-50"
                                        >
                                            🔍 切換或新增客戶
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <span className="font-bold text-gray-700">{quote.location?.name}: {quote.location?.address || '無地址'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default QuoteHeaderSection;
