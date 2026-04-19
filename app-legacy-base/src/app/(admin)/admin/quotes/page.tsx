'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import QuoteStatusBadge from '@/components/admin/quotes/QuoteStatusBadge';
import MoneyDisplay from '@/components/admin/quotes/MoneyDisplay';
import WarrantyBadge from '@/components/WarrantyBadge';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAdminListState } from '@/hooks/useAdminListState';
import { buildReturnTo, withReturnTo } from '@/lib/admin-return-to';
import { simplifyCompanyName } from '@/lib/utils';

interface QuoteListItem {
    id: string;
    quoteNumber: string;
    customer: { id: string; customerNumber: string; primaryCompanyName: string; primaryContact: string } | null;
    companyName: string;
    contacts: { id: string; name: string }[];
    status: string;
    totalAmount: string;
    taxRate: number;
    totalPaid: number;
    validUntil: string;
    isSuperseded: boolean;
    createdAt: string;
    name: string | null;
    area: string | null;
    invoiceIssuedAt: string | null;
    viewCount: number;
    firstViewedAt: string | null;
    warrantyStartDate: string | null;
    warrantyExpiresAt: string | null;
    warrantyMonths: number | null;
}

const QUOTING_STATUSES = ['draft', 'confirmed', 'sent'];
const FULFILLMENT_STATUSES = ['signed', 'construction', 'completed', 'paid'];

function QuotesPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const {
        page, pageSize, search, searchInput, filterValues,
        setPage, setSearch, setFilter,
    } = useAdminListState({
        pageSize: 20,
        debounceMs: 300,
        persistKey: 'quotes',
        excludeFromPersist: ['dateFrom', 'dateTo'],
        filters: [
            { key: 'stageView', defaultValue: 'all' },
            { key: 'status', defaultValue: '' },
            { key: 'invoiceStatus', defaultValue: '' },
            { key: 'warrantyStatus', defaultValue: '' },
            { key: 'dateFrom', defaultValue: '' },
            { key: 'dateTo', defaultValue: '' },
        ],
    });

    const stageView = filterValues.stageView || 'all';
    const status = filterValues.status;
    const invoiceStatus = filterValues.invoiceStatus;
    const warrantyStatus = filterValues.warrantyStatus;
    const dateFrom = filterValues.dateFrom;
    const dateTo = filterValues.dateTo;

    const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const returnTo = buildReturnTo(pathname, searchParams);
    const getQuoteDetailHref = useCallback((quoteNumber: string) => withReturnTo(`/admin/quotes/${quoteNumber}`, returnTo), [returnTo]);

    const fetchQuotes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                search,
                stageView,
                status,
                invoiceStatus,
                warrantyStatus,
                dateFrom,
                dateTo,
            });
            const res = await fetch(`/api/quotes?${params.toString()}`);
            const data = await res.json();
            setQuotes(data.quotes || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error(error);
            toast.error('讀取案件列表失敗');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, stageView, status, invoiceStatus, warrantyStatus, dateFrom, dateTo]);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '新案件' }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || '建立案件失敗');
                setCreating(false);
                return;
            }

            const data = await res.json();
            router.push(getQuoteDetailHref(data.quoteNumber));
        } catch (error) {
            console.error(error);
            toast.error('建立案件失敗');
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('確定要刪除此案件嗎？')) return;

        try {
            const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || '刪除案件失敗');
                return;
            }

            toast.success('已刪除案件');
            fetchQuotes();
        } catch (error) {
            console.error(error);
            toast.error('刪除案件失敗');
        }
    };

    const getCustomerName = (quote: QuoteListItem) => {
        return simplifyCompanyName(quote.customer?.primaryCompanyName) || quote.customer?.primaryContact || '未指定客戶';
    };

    const getPaymentBadge = (quote: QuoteListItem) => {
        if (!['signed', 'construction', 'completed', 'paid'].includes(quote.status)) return null;

        if (quote.status === 'paid' || Number(quote.totalPaid) >= Number(quote.totalAmount)) {
            return <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-black text-green-600">已收款</span>;
        }

        if (Number(quote.totalPaid) > 0) {
            return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">部分收款</span>;
        }

        return null;
    };

    const stageButtons = [
        { key: 'all', label: '全部案件' },
        { key: 'quoting', label: '報價中' },
        { key: 'fulfillment', label: '履約中' },
    ] as const;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-3xl font-black tracking-tight text-efan-primary">案件管理</h1>
                    <p className="font-medium tracking-tight text-gray-500">管理報價、施工、開票、收款與保固，快速掌握每一筆案件。</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/admin/quotes/templates"
                        className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                    >
                        模板管理
                    </Link>
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-efan-primary px-6 py-3 font-bold text-white shadow-lg shadow-efan-primary/20 transition-all hover:bg-efan-primary-dark disabled:opacity-50"
                    >
                        {creating ? '建立中...' : '新增案件'}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {stageButtons.map((button) => (
                    <button
                        key={button.key}
                        onClick={() => setFilter('stageView', button.key)}
                        className={`rounded-full px-5 py-2.5 text-sm font-black transition-all ${
                            stageView === button.key
                                ? 'bg-efan-primary text-white shadow-md shadow-efan-primary/15'
                                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {button.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-2 rounded-[28px] border border-gray-100 bg-white p-2 shadow-sm md:flex-row md:flex-wrap md:items-center">
                <select
                    value={status}
                    onChange={(e) => setFilter('status', e.target.value)}
                    className="rounded-2xl border-none bg-gray-50/50 px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-efan-primary md:w-40"
                >
                    <option value="">所有主狀態</option>
                    <option value="draft">草稿</option>
                    <option value="confirmed">已確認</option>
                    <option value="sent">已送出</option>
                    <option value="signed">已簽回</option>
                    <option value="construction">施工中</option>
                    <option value="completed">已完工</option>
                    <option value="paid">已付款</option>
                    <option value="closed">作廢</option>
                </select>

                <select
                    value={invoiceStatus}
                    onChange={(e) => setFilter('invoiceStatus', e.target.value)}
                    className="rounded-2xl border-none bg-gray-50/50 px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-efan-primary md:w-40"
                >
                    <option value="">所有開票狀態</option>
                    <option value="pending">待開票</option>
                    <option value="issued">已開票</option>
                    <option value="none-required">免開票</option>
                </select>

                <select
                    value={warrantyStatus}
                    onChange={(e) => setFilter('warrantyStatus', e.target.value)}
                    className="rounded-2xl border-none bg-gray-50/50 px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-efan-primary md:w-48"
                >
                    <option value="">所有保固狀態</option>
                    <option value="active">保固中</option>
                    <option value="expiring_30">30 天內到期</option>
                    <option value="expired">已過保</option>
                    <option value="no_warranty">無保固</option>
                </select>

                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setFilter('dateFrom', e.target.value)}
                    max="9999-12-31"
                    className="rounded-2xl border-none bg-gray-50/50 px-4 py-3 text-sm font-bold text-gray-500 focus:ring-2 focus:ring-efan-primary md:w-40"
                />
                <span className="text-center text-gray-300">~</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setFilter('dateTo', e.target.value)}
                    max="9999-12-31"
                    className="rounded-2xl border-none bg-gray-50/50 px-4 py-3 text-sm font-bold text-gray-500 focus:ring-2 focus:ring-efan-primary md:w-40"
                />

                <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg">🔎</span>
                    <input
                        type="text"
                        placeholder="搜尋案件編號、客戶或案名"
                        value={searchInput}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-2xl border-none bg-gray-50/50 py-3 pl-14 pr-4 text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-efan-primary"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-efan-primary"></div>
                    <span className="font-bold tracking-widest text-gray-400">讀取中...</span>
                </div>
            ) : quotes.length === 0 ? (
                <div className="rounded-[40px] border-2 border-dashed border-gray-100 py-20 text-center font-bold text-gray-300">
                    目前沒有符合條件的案件
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:hidden">
                        {quotes.map((quote) => {
                            const totalWithTax = Math.round(Number(quote.totalAmount) * (1 + Number(quote.taxRate || 0) / 100));
                            const contactNames = quote.contacts.length > 0 ? quote.contacts.map(c => c.name).join(' / ') : '-';

                            return (
                                <div
                                    key={quote.id}
                                    onClick={() => router.push(getQuoteDetailHref(quote.quoteNumber))}
                                    className={`rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all active:scale-[0.99] ${quote.isSuperseded ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-lg font-black text-efan-primary ${quote.isSuperseded ? 'line-through' : ''}`}>{quote.quoteNumber}</span>
                                                <QuoteStatusBadge status={quote.status} />
                                                <WarrantyBadge quote={quote} />
                                            </div>
                                            <div className="break-words text-base font-bold text-gray-800">{getCustomerName(quote)}</div>
                                            <div className="break-words text-sm font-medium text-gray-500">{quote.name || '-'}</div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">含稅總額</div>
                                            <div className="text-lg font-black text-gray-800">
                                                <MoneyDisplay amount={totalWithTax} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-gray-50/70 p-3 text-sm">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">區域</div>
                                            <div className="mt-1 font-bold text-indigo-500">{quote.area || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">聯絡人</div>
                                            <div className="mt-1 break-words font-medium text-gray-600">{contactNames}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">{getPaymentBadge(quote)}</div>

                                    <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                        <a
                                            href={`/api/quotes/${quote.id}/pdf`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="min-w-[88px] flex-1 rounded-2xl bg-emerald-50 px-4 py-2.5 text-center text-sm font-black text-emerald-600"
                                        >
                                            PDF
                                        </a>
                                        <button
                                            onClick={() => handleDelete(quote.id)}
                                            className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-500"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="hidden overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">案件編號</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">客戶</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">區域</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">案名</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">聯絡人</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">主狀態</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">保固</th>
                                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">含稅總額</th>
                                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map((quote) => (
                                    <tr
                                        key={quote.id}
                                        onClick={() => router.push(getQuoteDetailHref(quote.quoteNumber))}
                                        className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${quote.isSuperseded ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-5 py-4">
                                            <span className={`font-black text-efan-primary ${quote.isSuperseded ? 'line-through' : ''}`}>{quote.quoteNumber}</span>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-gray-700">{getCustomerName(quote)}</td>
                                        <td className="px-5 py-4 font-bold text-indigo-500">{quote.area || '-'}</td>
                                        <td className="px-5 py-4 font-bold text-gray-700">{quote.name || '-'}</td>
                                        <td className="px-5 py-4 font-medium text-gray-500">{quote.contacts.length > 0 ? quote.contacts.map(c => c.name).join(' / ') : '-'}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <QuoteStatusBadge status={quote.status} />
                                                {getPaymentBadge(quote)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <WarrantyBadge quote={quote} />
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-gray-700">
                                            <MoneyDisplay amount={Math.round(Number(quote.totalAmount) * (1 + Number(quote.taxRate || 0) / 100))} />
                                        </td>
                                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer" className="rounded-xl p-2 text-xs transition-colors hover:bg-gray-100" title="PDF">📄</a>
                                                <button onClick={() => handleDelete(quote.id)} className="rounded-xl p-2 text-xs text-red-400 transition-colors hover:bg-red-50" title="刪除">🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
}

export default function QuotesPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-efan-primary"></div>
                    <span className="font-bold tracking-widest text-gray-400">讀取中...</span>
                </div>
            }
        >
            <QuotesPageContent />
        </Suspense>
    );
}
