'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProductTable from '@/components/admin/ProductTable';
import CategoryModal from '@/components/admin/CategoryModal';
import ProductImportModal from '@/components/admin/ProductImportModal';
import AdminPagination from '@/components/admin/AdminPagination';
import { useAdminListState } from '@/hooks/useAdminListState';
import { toast } from 'sonner';
import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';

function ProductsPageContent() {
    const {
        page, pageSize, search, searchInput, filterValues,
        setPage, setSearch, setFilter,
    } = useAdminListState({
        pageSize: 20,
        debounceMs: 300,
        persistKey: 'products',
        filters: [
            { key: 'categoryId', defaultValue: '' },
        ],
    });

    const categoryId = filterValues.categoryId;

    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/products/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (e) {
            console.error('Failed to fetch categories:', e);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                search,
                categoryId,
            });
            const res = await fetch(`/api/products?${queryParams.toString()}`);
            const data = await res.json();
            setProducts(data.products || []);
            setTotal(data.total || 0);
        } catch (e) {
            console.error('Failed to fetch products:', e);
            toast.error(ADMIN_PRODUCT_COPY.list.fetchError);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, categoryId]);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts, fetchCategories]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(ADMIN_PRODUCT_COPY.list.deleteSuccess);
                fetchProducts();
            } else {
                toast.error(ADMIN_PRODUCT_COPY.list.deleteError);
            }
        } catch (e) {
            console.error(e);
            toast.error(ADMIN_PRODUCT_COPY.list.deleteError);
        }
    };

    const handleExport = () => {
        window.location.href = '/api/products/export';
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === products.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map((p: any) => p.id)));
        }
    };

    const handleBatchWebsite = async (showOnWebsite: boolean) => {
        if (selectedIds.size === 0) return;
        try {
            const res = await fetch('/api/products/batch-website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds), showOnWebsite }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setSelectedIds(new Set());
                fetchProducts();
            } else {
                toast.error(data.error || ADMIN_PRODUCT_COPY.list.batchError);
            }
        } catch {
            toast.error(ADMIN_PRODUCT_COPY.list.batchError);
        }
    };

    const handleReorder = async (items: { id: string; sortOrder: number }[]) => {
        const idToOrder = new Map(items.map((i) => [i.id, i.sortOrder]));
        const sorted = [...products].sort((a: any, b: any) => (idToOrder.get(a.id) ?? 0) - (idToOrder.get(b.id) ?? 0));
        setProducts(sorted as any);

        try {
            const res = await fetch('/api/products/sort-order', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (res.ok) {
                toast.success(ADMIN_PRODUCT_COPY.list.reorderSuccess);
            } else {
                toast.error(ADMIN_PRODUCT_COPY.list.reorderError);
                fetchProducts();
            }
        } catch {
            toast.error(ADMIN_PRODUCT_COPY.list.reorderError);
            fetchProducts();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-efan-primary tracking-tight mb-2">{ADMIN_PRODUCT_COPY.list.title}</h1>
                    <p className="text-gray-500 font-medium tracking-tight">{ADMIN_PRODUCT_COPY.list.description}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExport}
                        className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        {ADMIN_PRODUCT_COPY.list.exportExcel}
                    </button>
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        {ADMIN_PRODUCT_COPY.list.importExcel}
                    </button>
                    <button
                        onClick={() => setIsCategoryOpen(true)}
                        className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        {ADMIN_PRODUCT_COPY.list.manageCategories}
                    </button>
                    <Link
                        href="/admin/products/new"
                        className="px-6 py-3 rounded-2xl bg-efan-primary text-white font-bold hover:bg-efan-primary-dark transition-all shadow-lg shadow-efan-primary/20 flex items-center gap-2"
                    >
                        {ADMIN_PRODUCT_COPY.list.addProduct}
                    </Link>
                </div>
            </div>

            <div className="bg-white p-2 rounded-[28px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-2">
                <div className="md:w-64">
                    <select
                        value={categoryId}
                        onChange={(e) => setFilter('categoryId', e.target.value)}
                        className="w-full h-full px-6 py-4 bg-gray-50/50 rounded-3xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-700 appearance-none select-none"
                    >
                        <option value="">{ADMIN_PRODUCT_COPY.list.allCategories}</option>
                        {categories.map((c: any) => {
                            let depth = 0;
                            let current = c;
                            while (current.parentId) {
                                depth++;
                                const parent = categories.find((p: any) => p.id === current.parentId);
                                if (parent) current = parent;
                                else break;
                            }
                            return (
                                <option key={c.id} value={c.id}>
                                    {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '└ ' : ''}{c.name}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="flex-1 relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl pointer-events-none">🔎</span>
                    <input
                        type="text"
                        placeholder={ADMIN_PRODUCT_COPY.list.searchPlaceholder}
                        className="w-full pl-16 pr-6 py-4 bg-gray-50/50 rounded-3xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold placeholder:text-gray-300"
                        value={searchInput}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div className="bg-efan-primary/10 border border-efan-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                    <span className="font-black text-efan-primary text-sm">
                        {ADMIN_PRODUCT_COPY.list.selectedCount(selectedIds.size)}
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleBatchWebsite(true)}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-sm"
                        >
                            {ADMIN_PRODUCT_COPY.list.batchShow}
                        </button>
                        <button
                            onClick={() => handleBatchWebsite(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-xl text-xs font-black hover:bg-gray-600 transition-all shadow-sm"
                        >
                            {ADMIN_PRODUCT_COPY.list.batchHide}
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-black hover:bg-gray-50 transition-all"
                        >
                            {ADMIN_PRODUCT_COPY.list.clearSelection}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-efan-primary"></div>
                    <span className="text-gray-400 font-bold animate-pulse tracking-widest">{ADMIN_PRODUCT_COPY.common.loading}</span>
                </div>
            ) : (
                <>
                    <ProductTable
                        products={products}
                        onDelete={handleDelete}
                        onReorder={handleReorder}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                    />

                    <AdminPagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={setPage}
                    />
                </>
            )}

            {isCategoryOpen && (
                <CategoryModal
                    onClose={() => {
                        setIsCategoryOpen(false);
                        fetchCategories();
                        fetchProducts();
                    }}
                />
            )}

            {isImportOpen && (
                <ProductImportModal
                    onClose={() => {
                        setIsImportOpen(false);
                        fetchCategories();
                        fetchProducts();
                    }}
                    onSuccess={() => {
                        fetchCategories();
                        fetchProducts();
                    }}
                />
            )}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense
            fallback={
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-efan-primary"></div>
                    <span className="text-gray-400 font-bold animate-pulse tracking-widest">{ADMIN_PRODUCT_COPY.common.loading}</span>
                </div>
            }
        >
            <ProductsPageContent />
        </Suspense>
    );
}
