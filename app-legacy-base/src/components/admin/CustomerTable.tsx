'use client';

import Link from 'next/link';
import { formatMobile, formatPhone } from '@/lib/phone-format';

interface CustomerItem {
    id: string;
    customerNumber: string;
    primaryCompanyName: string | null;
    primaryContact: string | null;
    primaryContactMobile: string | null;
    primaryContactPhone: string | null;
    quoteCount: number;
    dealCount: number;
    dealTotal: number;
    lastQuoteDate: string | null;
    isDeleted: boolean;
    createdAt: string;
}

interface Props {
    customers: CustomerItem[];
    onDelete: (id: string) => void;
    onCreateQuote: (id: string) => void;
    creatingQuoteId?: string | null;
}

function formatDate(value: string | null) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toISOString().slice(0, 10).replace(/-/g, '/');
}

export default function CustomerTable({ customers, onDelete, onCreateQuote, creatingQuoteId }: Props) {
    return (
        <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
            <div className="grid gap-4 p-4 md:hidden">
                {!customers.length ? (
                    <div className="rounded-3xl border border-dashed border-gray-100 px-6 py-12 text-center text-gray-400">
                        目前沒有符合條件的客戶。
                    </div>
                ) : (
                    customers.map((customer) => (
                        <div key={customer.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <Link href={`/admin/customers/${customer.id}`} className="font-mono text-xs font-black text-efan-primary">
                                        {customer.customerNumber}
                                    </Link>
                                    <div className="mt-2 break-words text-base font-black text-gray-900">
                                        {customer.primaryCompanyName || '未命名客戶'}
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-gray-500">
                                        {customer.primaryContact || '--'}
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-gray-50 px-3 py-2 text-right">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">成交</div>
                                    <div className="text-sm font-black text-emerald-600">{customer.dealCount || 0}</div>
                                    <div className="text-[10px] font-bold text-gray-400">$ {(customer.dealTotal || 0).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl bg-gray-50/70 p-3 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">報價</span>
                                    <span className="font-black text-efan-secondary">{customer.quoteCount || 0}</span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    {customer.primaryContactMobile ? (
                                        <a href={`tel:${customer.primaryContactMobile}`} className="block font-bold text-gray-700">
                                            {formatMobile(customer.primaryContactMobile)}
                                        </a>
                                    ) : null}
                                    {customer.primaryContactPhone ? (
                                        <a href={`tel:${customer.primaryContactPhone}`} className="block text-xs font-medium text-gray-500">
                                            {formatPhone(customer.primaryContactPhone)}
                                        </a>
                                    ) : null}
                                    {!customer.primaryContactMobile && !customer.primaryContactPhone ? (
                                        <span className="text-sm text-gray-300">--</span>
                                    ) : null}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">最近報價</span>
                                    <span className="text-xs font-bold text-gray-500">{formatDate(customer.lastQuoteDate)}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link
                                    href={`/admin/customers/${customer.id}`}
                                    className="flex-1 rounded-2xl bg-gray-100 px-4 py-2.5 text-center text-sm font-black text-gray-700"
                                >
                                    開啟
                                </Link>
                                <button
                                    onClick={() => onCreateQuote(customer.id)}
                                    disabled={creatingQuoteId === customer.id}
                                    className="flex-1 rounded-2xl bg-efan-primary px-4 py-2.5 text-center text-sm font-black text-white disabled:opacity-50"
                                >
                                    {creatingQuoteId === customer.id ? '處理中' : '新增報價'}
                                </button>
                                {customer.primaryContactMobile ? (
                                    <a
                                        href={`tel:${customer.primaryContactMobile}`}
                                        className="flex-1 rounded-2xl bg-emerald-50 px-4 py-2.5 text-center text-sm font-black text-emerald-600"
                                    >
                                        撥打
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">客戶編號</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">客戶</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">聯絡方式</th>
                            <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-gray-400">報價 / 成交</th>
                            <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-gray-400">最近報價</th>
                            <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-gray-400">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {!customers.length ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    目前沒有符合條件的客戶。
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id} className="transition-colors hover:bg-blue-50/30">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/admin/customers/${customer.id}`} className="font-mono text-xs font-black text-efan-primary hover:underline">
                                            {customer.customerNumber}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/customers/${customer.id}`} className="block">
                                            <div className="max-w-[220px] truncate font-black text-gray-900">
                                                {customer.primaryCompanyName || '未命名客戶'}
                                            </div>
                                            <div className="text-xs font-medium text-gray-500">{customer.primaryContact || '--'}</div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        {customer.primaryContactMobile ? (
                                            <div className="font-bold text-gray-700">{formatMobile(customer.primaryContactMobile)}</div>
                                        ) : null}
                                        {customer.primaryContactPhone ? (
                                            <div className="text-xs font-medium text-gray-500">{formatPhone(customer.primaryContactPhone)}</div>
                                        ) : null}
                                        {!customer.primaryContactMobile && !customer.primaryContactPhone ? (
                                            <span className="text-gray-300">--</span>
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div>
                                                <div className="text-xs font-black text-gray-400">報價</div>
                                                <div className="text-sm font-black text-efan-secondary">{customer.quoteCount || 0}</div>
                                            </div>
                                            <div className="h-6 w-px bg-gray-100" />
                                            <div>
                                                <div className="text-xs font-black text-gray-400">成交</div>
                                                <div className="text-sm font-black text-emerald-600">{customer.dealCount || 0}</div>
                                            </div>
                                        </div>
                                        <div className="mt-1 text-[10px] font-bold text-gray-400">$ {(customer.dealTotal || 0).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-gray-500">
                                        {formatDate(customer.lastQuoteDate)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onCreateQuote(customer.id)}
                                                disabled={creatingQuoteId === customer.id}
                                                className="rounded-xl bg-efan-primary px-3 py-2 text-xs font-black text-white shadow-sm disabled:opacity-50"
                                            >
                                                {creatingQuoteId === customer.id ? '處理中' : '新增報價'}
                                            </button>
                                            <Link
                                                href={`/admin/customers/${customer.id}`}
                                                className="rounded-xl bg-white px-3 py-2 text-xs font-black text-gray-600 ring-1 ring-gray-200 transition-all hover:bg-gray-50"
                                            >
                                                開啟
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (confirm('確定要刪除這位客戶嗎？')) onDelete(customer.id);
                                                }}
                                                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-500"
                                            >
                                                刪除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
