'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    quoteName: string | null;
    brand: string | null;
    model: string | null;
    unit: string | null;
    sellingPrice: string;
    repairPrice: string | null;
    costPrice: string;
    isHiddenItem: boolean;
}

interface Category {
    id: string;
    name: string;
}

interface Template {
    id: string;
    name: string;
    category: { name: string } | null;
    _count: { items: number };
}

interface TemplateDetail {
    id: string;
    name: string;
    taxRate?: string;
    discountAmount?: string;
    transportFee?: string;
    items: {
        id: string;
        name: string;
        description: string | null;
        quantity: number;
        sortOrder: number;
        unitPrice: string;
        product: {
            id: string;
            name: string;
            quoteName: string | null;
            sellingPrice: string;
            costPrice: string;
            unit: string | null;
            isDeleted: boolean;
        };
    }[];
}

interface ProductPickerProps {
    onAddProduct: (productId: string, priceMode: string) => void;
    collapsed?: boolean;
    quoteId?: string;
    activeVariantId?: string | null;
    onImported?: () => void;
}

export default function ProductPicker({ onAddProduct, collapsed = false, quoteId, activeVariantId, onImported }: ProductPickerProps) {
    const [activeTab, setActiveTab] = useState<'product' | 'template'>('product');
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categoryId, setCategoryId] = useState('');
    const [priceMode, setPriceMode] = useState('selling');
    const [search, setSearch] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(collapsed);

    // Template tab state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
    const [templateDetail, setTemplateDetail] = useState<TemplateDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [importing, setImporting] = useState(false);

    // Product tab data fetching
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/products/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (e) { console.error(e); }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const params = new URLSearchParams({ pageSize: '100', search, categoryId });
            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            setProducts(data.products || []);
        } catch (e) { console.error(e); }
    }, [search, categoryId]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Template tab data fetching
    const fetchTemplates = useCallback(async () => {
        setLoadingTemplates(true);
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (e) { console.error(e); }
        finally { setLoadingTemplates(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'template' && templates.length === 0) {
            fetchTemplates();
        }
    }, [activeTab, templates.length, fetchTemplates]);

    // Lazy load template detail
    const handleTemplateClick = async (tplId: string) => {
        if (expandedTemplateId === tplId) {
            setExpandedTemplateId(null);
            setTemplateDetail(null);
            return;
        }
        setExpandedTemplateId(tplId);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/templates/${tplId}`);
            const data = await res.json();
            setTemplateDetail(data.template);
        } catch (e) {
            console.error(e);
            toast.error('載入模板明細失敗');
        } finally {
            setLoadingDetail(false);
        }
    };

    // Import template
    const handleImport = async (tplId: string, itemCount: number) => {
        if (!quoteId) return;
        if (!window.confirm(`將新增 ${itemCount} 個項目到報價單末尾，確定匯入嗎？`)) return;

        setImporting(true);
        try {
            const res = await fetch(`/api/quotes/${quoteId}/import-template`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: tplId, variantId: activeVariantId }),
            });
            const data = await res.json();
            if (res.ok) {
                const msg = data.skipped && data.skipped.length > 0
                    ? `已匯入 ${data.imported} 項，${data.skipped.length} 項因產品已刪除而跳過`
                    : `已匯入 ${data.imported} 項`;
                toast.success(msg);
                onImported?.();
            } else {
                toast.error(data.error || '匯入失敗');
            }
        } catch (e) {
            toast.error('匯入時發生錯誤');
        } finally {
            setImporting(false);
        }
    };

    if (isCollapsed) {
        return (
            <div className="w-12 bg-white border border-gray-100 rounded-2xl shadow-sm p-2 flex flex-col items-center">
                <button onClick={() => setIsCollapsed(false)} className="text-xl hover:scale-110 transition-transform" title="展開產品列表">📦</button>
            </div>
        );
    }

    return (
        <div className="w-[340px] bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col max-h-[calc(100vh-200px)]">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('product')}
                    className={`flex-1 py-3 text-sm font-bold transition-all relative ${activeTab === 'product' ? 'text-efan-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    📦 產品
                    {activeTab === 'product' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-efan-primary rounded-full" />}
                </button>
                {quoteId && (
                    <button
                        onClick={() => setActiveTab('template')}
                        className={`flex-1 py-3 text-sm font-bold transition-all relative ${activeTab === 'template' ? 'text-efan-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        📋 模板
                        {activeTab === 'template' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-efan-primary rounded-full" />}
                    </button>
                )}
            </div>

            {/* Product Tab */}
            {activeTab === 'product' && (
                <>
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-700">📦 產品選擇</h3>
                            <button onClick={() => setIsCollapsed(true)} className="text-gray-400 hover:text-gray-600 text-sm">收合</button>
                        </div>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-efan-primary"
                        >
                            <option value="">所有分類</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPriceMode('selling')}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${priceMode === 'selling' ? 'bg-efan-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                            >零售</button>
                            <button
                                onClick={() => setPriceMode('repair')}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${priceMode === 'repair' ? 'bg-efan-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                            >維修</button>
                        </div>
                        <input
                            type="text"
                            placeholder="搜尋品名/型號/廠牌..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-efan-primary placeholder:text-gray-300"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {products.length === 0 && <p className="text-center text-gray-300 text-sm py-8">無產品</p>}
                        {products.map(p => {
                            const price = priceMode === 'repair' ? (p.repairPrice || p.sellingPrice) : p.sellingPrice;
                            return (
                                <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 group transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-700 truncate">{p.quoteName || p.name}</div>
                                        <div className="text-xs text-gray-400 truncate">
                                            {[p.brand, p.model].filter(Boolean).join(' ')} · ${Number(price).toLocaleString('zh-TW')}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onAddProduct(p.id, priceMode)}
                                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-efan-primary text-white font-bold text-lg flex items-center justify-center hover:scale-110 transition-all shadow-sm"
                                        title="加入報價"
                                    >+</button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Template Tab */}
            {activeTab === 'template' && (
                <>
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-700">📋 模板匯入</h3>
                            <button onClick={() => setIsCollapsed(true)} className="text-gray-400 hover:text-gray-600 text-sm">收合</button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">點選模板預覽明細，一鍵匯入到報價單</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingTemplates && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-efan-primary" />
                            </div>
                        )}
                        {!loadingTemplates && templates.length === 0 && (
                            <p className="text-center text-gray-300 text-sm py-8">尚無模板</p>
                        )}
                        {templates.map(t => (
                            <div key={t.id} className="rounded-xl border border-gray-100 overflow-hidden transition-all">
                                {/* Template Header */}
                                <button
                                    onClick={() => handleTemplateClick(t.id)}
                                    className={`w-full text-left p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${expandedTemplateId === t.id ? 'bg-gray-50' : ''}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-700 truncate">{t.name}</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                            {t.category && <span>{t.category.name}</span>}
                                            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{t._count.items} 項</span>
                                        </div>
                                    </div>
                                    <span className={`text-gray-300 text-xs transition-transform ${expandedTemplateId === t.id ? 'rotate-180' : ''}`}>▼</span>
                                </button>

                                {/* Expanded Detail */}
                                {expandedTemplateId === t.id && (
                                    <div className="border-t border-gray-100 bg-gray-50/50">
                                        {loadingDetail ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-efan-primary" />
                                            </div>
                                        ) : templateDetail ? (
                                            <>
                                                <div className="px-3 py-2 space-y-1 max-h-[240px] overflow-y-auto">
                                                    {templateDetail.items.map((item, idx) => {
                                                        const isDeleted = item.product.isDeleted;
                                                        return (
                                                            <div key={item.id} className={`flex items-center gap-2 text-xs py-1 ${isDeleted ? 'opacity-40 line-through' : ''}`}>
                                                                <span className="text-gray-300 w-4 text-right shrink-0">{idx + 1}</span>
                                                                <span className="flex-1 font-bold text-gray-600 truncate">
                                                                    {item.product.quoteName || item.product.name}
                                                                    {isDeleted && <span className="ml-1 text-red-400 no-underline">(已刪除)</span>}
                                                                </span>
                                                                <span className="text-gray-400 shrink-0">×{item.quantity}</span>
                                                                {!isDeleted && (
                                                                    <span className="text-gray-400 shrink-0 w-16 text-right">
                                                                        ${Number(item.product.sellingPrice).toLocaleString('zh-TW')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="p-3 border-t border-gray-100">
                                                    <button
                                                        onClick={() => {
                                                            const validCount = templateDetail.items.filter(i => !i.product.isDeleted).length;
                                                            handleImport(t.id, validCount);
                                                        }}
                                                        disabled={importing}
                                                        className={`w-full py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${importing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-efan-primary text-white hover:bg-efan-primary/90 shadow-sm shadow-efan-primary/20'}`}
                                                    >
                                                        {importing ? (
                                                            <><span className="animate-spin">⌛</span> 匯入中...</>
                                                        ) : (
                                                            <>⬇️ 匯入全部（{templateDetail.items.filter(i => !i.product.isDeleted).length} 項）</>
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
