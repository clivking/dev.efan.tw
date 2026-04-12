'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CustomerTable from '@/components/admin/CustomerTable';
import ImportModal from '@/components/admin/ImportModal';
import { buildReturnTo, withReturnTo } from '@/lib/admin-return-to';

export default function CustomersPage() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [customers, setCustomers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('lastQuote');
    const [loading, setLoading] = useState(true);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [creatingQuoteId, setCreatingQuoteId] = useState<string | null>(null);
    const returnTo = buildReturnTo(pathname, searchParams);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/customers?page=${page}&pageSize=20&search=${encodeURIComponent(search)}&sortBy=${sortBy}`);
            const data = await res.json();
            setCustomers(data.customers);
            setTotal(data.total);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, search, sortBy]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            if (res.ok) fetchCustomers();
        } catch (e) {
            console.error(e);
        }
    };

    const handleExport = async () => {
        window.location.href = '/api/customers/export';
    };

    const handleCreateQuote = async (customerId: string) => {
        setCreatingQuoteId(customerId);
        try {
            const customer = customers.find((item: any) => item.id === customerId) as any;
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    name: `${customer?.primaryCompanyName || customer?.primaryContact || '客戶'} - 新報價`,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                router.push(withReturnTo(`/admin/quotes/${data.quoteNumber}`, returnTo));
                return;
            }

            alert(data.error || '建立報價單失敗');
        } catch (error) {
            console.error(error);
            alert('建立報價單失敗');
        } finally {
            setCreatingQuoteId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-efan-primary tracking-tight mb-2">客戶管理</h1>
                    <p className="text-gray-500 font-medium">管理您的客戶資料、聯絡人與案場資訊。</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleExport}
                        className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        📥 匯出 Excel
                    </button>
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        📤 批次匯入
                    </button>
                    <Link
                        href="/admin/customers/new"
                        className="px-6 py-3 rounded-2xl bg-efan-primary text-white font-bold hover:bg-efan-primary-dark transition-all shadow-lg shadow-efan-primary/20 flex items-center gap-2"
                    >
                        ➕ 新增客戶
                    </Link>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-white p-2 rounded-[28px] shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="flex-1 relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                        <input
                            type="text"
                            placeholder="搜尋公司名稱、聯絡人、電話、地址、編號..."
                            className="w-full pl-16 pr-6 py-4 bg-gray-50/50 rounded-3xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold placeholder:text-gray-300"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
                <div className="bg-white p-2 rounded-[28px] shadow-sm border border-gray-100 flex items-center px-4">
                    <span className="text-gray-400 font-bold text-sm whitespace-nowrap ml-2">排序：</span>
                    <select
                        className="bg-transparent border-none focus:ring-0 font-bold text-gray-700 py-4 pr-10 cursor-pointer"
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="lastQuote">最近有報價單</option>
                        <option value="lastDeal">最近有成交</option>
                        <option value="customerNumber">客戶編號 (最新優先)</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-efan-primary"></div>
                    <span className="text-gray-400 font-bold animate-pulse">正在讀取客戶資料...</span>
                </div>
            ) : (
                <>
                    <CustomerTable
                        customers={customers}
                        onDelete={handleDelete}
                        onCreateQuote={handleCreateQuote}
                        creatingQuoteId={creatingQuoteId}
                    />

                    <div className="flex flex-col gap-4 pt-6 border-t border-gray-100 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm font-bold text-gray-400">
                            顯示第 {(page - 1) * 20 + 1} 至 {Math.min(page * 20, total)} 筆，共 {total} 筆
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:flex">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-6 py-3 rounded-xl bg-white border border-gray-200 font-bold disabled:opacity-30 transition-all hover:bg-gray-50"
                            >
                                上一頁
                            </button>
                            <button
                                disabled={page * 20 >= total}
                                onClick={() => setPage(p => p + 1)}
                                className="px-6 py-3 rounded-xl bg-white border border-gray-200 font-bold disabled:opacity-30 transition-all hover:bg-gray-50"
                            >
                                下一頁
                            </button>
                        </div>
                    </div>
                </>
            )}

            {isImportOpen && (
                <ImportModal
                    onClose={() => setIsImportOpen(false)}
                    onSuccess={() => fetchCustomers()}
                />
            )}
        </div>
    );
}
