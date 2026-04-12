'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SpecTemplateEditor from '@/components/admin/products/SpecTemplateEditor';

interface CategoryModalProps {
    onClose: () => void;
}

export default function CategoryModal({ onClose }: CategoryModalProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [parentId, setParentId] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [activePanel, setActivePanel] = useState<'seo' | 'template' | null>(null);
    const [editForm, setEditForm] = useState({ showOnWebsite: true, seoSlug: '', seoTitle: '', seoDescription: '' });
    const [editSpecTemplate, setEditSpecTemplate] = useState<any[] | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products/categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const getDepth = (cat: any) => {
        let depth = 0;
        let current = cat;
        while (current.parentId) {
            depth++;
            const parent = categories.find((p) => p.id === current.parentId);
            if (!parent) break;
            current = parent;
        }
        return depth;
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        const siblings = categories.filter((c) => c.parentId === (parentId || null));
        const maxSortOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.sortOrder)) : -1;

        try {
            const res = await fetch('/api/products/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategoryName,
                    parentId: parentId || null,
                    sortOrder: maxSortOrder + 1,
                }),
            });

            if (res.ok) {
                toast.success('分類已新增');
                setNewCategoryName('');
                setParentId('');
                fetchCategories();
            } else {
                toast.error('新增分類失敗');
            }
        } catch (e) {
            console.error(e);
            toast.error('新增分類失敗');
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId === targetId) return;

        const source = categories.find((c) => c.id === sourceId);
        const target = categories.find((c) => c.id === targetId);
        if (!source || !target) return;

        try {
            const siblings = categories
                .filter((c) => c.parentId === target.parentId && c.id !== sourceId)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            const targetIndex = siblings.findIndex((s) => s.id === targetId);
            siblings.splice(targetIndex + 1, 0, source);

            const updates = siblings.map((cat, index) => ({
                id: cat.id,
                name: cat.name,
                parentId: target.parentId,
                sortOrder: index,
            }));

            for (const update of updates) {
                await fetch(`/api/products/categories/${update.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(update),
                });
            }

            toast.success('分類排序已更新');
            fetchCategories();
        } catch (err) {
            console.error(err);
            toast.error('儲存分類排序失敗');
        } finally {
            setDraggedId(null);
        }
    };

    const handleDelete = async (id: string, cascade = false) => {
        if (!cascade && !confirm('確定要刪除這個分類嗎？')) return;

        try {
            const res = await fetch(`/api/products/categories/${id}${cascade ? '?cascade=true' : ''}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success(cascade ? '分類與底下產品已一併刪除' : '分類已刪除');
                fetchCategories();
                return;
            }

            const data = await res.json();
            if (res.status === 400 && data.productCount > 0) {
                const confirmed = confirm(`這個分類底下還有 ${data.productCount} 個產品。\n\n如果你要繼續刪除，系統會連同這些產品一起刪掉。確定要全部刪除嗎？`);
                if (confirmed) handleDelete(id, true);
                else toast.info('已取消刪除');
            } else {
                toast.error(data.error || '刪除分類失敗');
            }
        } catch (e) {
            console.error(e);
            toast.error('刪除分類失敗');
        }
    };

    const handleTogglePanel = (catId: string, panel: 'seo' | 'template') => {
        if (activeEditId === catId && activePanel === panel) {
            setActiveEditId(null);
            setActivePanel(null);
            return;
        }

        const cat = categories.find((c) => c.id === catId);
        if (!cat) return;

        if (activeEditId !== catId) {
            setEditForm({
                showOnWebsite: cat.showOnWebsite ?? true,
                seoSlug: cat.seoSlug || '',
                seoTitle: cat.seoTitle || '',
                seoDescription: cat.seoDescription || '',
            });
            setEditSpecTemplate(cat.specTemplate || null);
        }

        setActiveEditId(catId);
        setActivePanel(panel);
    };

    const handleSaveSettings = async () => {
        if (!activeEditId) return;
        const cat = categories.find((c) => c.id === activeEditId);
        if (!cat) return;

        try {
            const res = await fetch(`/api/products/categories/${activeEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cat.name,
                    parentId: cat.parentId,
                    sortOrder: cat.sortOrder,
                    ...editForm,
                    specTemplate: editSpecTemplate,
                }),
            });

            if (res.ok) {
                toast.success('分類設定已儲存');
                setActiveEditId(null);
                setActivePanel(null);
                fetchCategories();
            } else {
                const data = await res.json();
                toast.error(data.error || '儲存分類設定失敗');
            }
        } catch {
            toast.error('儲存分類設定失敗');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h2 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                            <span className="p-1.5 bg-efan-primary/10 rounded-lg text-efan-primary text-sm">📁</span>
                            管理產品分類
                        </h2>
                        <p className="text-gray-400 font-bold text-xs tracking-tight mt-0.5">新增、排序、設定分類 SEO 與規格模板。</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-all text-base">
                        ✕
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <form onSubmit={handleAdd} className="space-y-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="輸入新的分類名稱，例如：門禁控制器"
                                className="flex-1 px-4 py-2.5 bg-white rounded-xl border-none focus:ring-2 focus:ring-efan-primary shadow-sm font-black text-sm placeholder:text-gray-300"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-efan-primary text-white font-black text-sm hover:bg-efan-primary-dark transition-all shadow-lg shadow-efan-primary/20 whitespace-nowrap"
                            >
                                新增分類
                            </button>
                        </div>
                        <div className="flex items-center gap-3 px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">上層分類</label>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="flex-1 px-3 py-2 bg-white rounded-lg border-none text-xs font-bold text-gray-600 focus:ring-2 focus:ring-efan-primary shadow-sm"
                            >
                                <option value="">（無，上層分類）</option>
                                {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {'\u00A0'.repeat(getDepth(c) * 4)}{getDepth(c) > 0 ? '↳ ' : ''}{c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </form>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="py-12 text-center text-gray-300 font-bold animate-pulse flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-4 border-efan-primary border-t-transparent rounded-full animate-spin"></div>
                                <span>正在讀取分類...</span>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="py-12 text-center text-gray-300 font-bold italic">目前沒有任何分類</div>
                        ) : (
                            categories.map((c: any) => {
                                const depth = getDepth(c);
                                const isDragged = draggedId === c.id;

                                return (
                                    <div key={c.id} style={{ marginLeft: `${depth * 2}rem` }}>
                                        <div
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, c.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, c.id)}
                                            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all cursor-move ${isDragged ? 'opacity-30 bg-gray-100 border-gray-200' : 'bg-white hover:bg-efan-primary/5 hover:border-efan-primary/20 border-gray-100 shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="text-gray-300 group-hover:text-efan-primary transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                                                    </svg>
                                                </div>
                                                <span className="text-base group-hover:scale-110 transition-transform duration-300">
                                                    {depth > 0 ? '↳' : '📁'}
                                                </span>
                                                <span className={`font-black text-gray-700 tracking-tighter ${depth > 0 ? 'text-xs' : 'text-sm'}`}>{c.name}</span>
                                                <span className="px-2 py-0.5 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">
                                                    {c.productCount} 產品
                                                </span>
                                                {c.showOnWebsite && (
                                                    <span className="text-sm" title="已顯示在前台">🌐</span>
                                                )}
                                                {c.seoSlug && (
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-mono font-bold border border-emerald-100">
                                                        /{c.seoSlug}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleTogglePanel(c.id, 'seo'); }}
                                                    className={`p-2 rounded-xl transition-all ${activeEditId === c.id && activePanel === 'seo' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-300 hover:bg-emerald-100 hover:text-emerald-600 opacity-0 group-hover:opacity-100'}`}
                                                    title="SEO 設定"
                                                >
                                                    SEO
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleTogglePanel(c.id, 'template'); }}
                                                    className={`p-2 rounded-xl transition-all ${activeEditId === c.id && activePanel === 'template' ? 'bg-blue-500 text-white' : 'bg-white text-gray-300 hover:bg-blue-100 hover:text-blue-600 opacity-0 group-hover:opacity-100'}`}
                                                    title="規格模板"
                                                >
                                                    規格
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-2 rounded-xl bg-white text-gray-300 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    刪除
                                                </button>
                                            </div>
                                        </div>

                                        {activeEditId === c.id && activePanel === 'seo' && (
                                            <div className="ml-6 mt-1.5 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">SEO 設定</span>
                                                    <div
                                                        onClick={() => setEditForm((prev) => ({ ...prev, showOnWebsite: !prev.showOnWebsite }))}
                                                        className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${editForm.showOnWebsite ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${editForm.showOnWebsite ? 'left-6' : 'left-0.5'}`} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">SEO Slug</label>
                                                        <input
                                                            placeholder="access-control"
                                                            className="w-full px-3 py-2 bg-white rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 border-none"
                                                            value={editForm.seoSlug}
                                                            onChange={(e) => setEditForm((prev) => ({ ...prev, seoSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">SEO 標題</label>
                                                        <input
                                                            placeholder="例如：門禁控制器分類頁"
                                                            className="w-full px-3 py-2 bg-white rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 border-none"
                                                            value={editForm.seoTitle}
                                                            onChange={(e) => setEditForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">SEO 描述</label>
                                                    <textarea
                                                        placeholder="輸入這個分類頁的 meta description"
                                                        className="w-full px-3 py-2 bg-white rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 border-none min-h-[50px]"
                                                        value={editForm.seoDescription}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, seoDescription: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveSettings}
                                                        className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                                    >
                                                        儲存 SEO 設定
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeEditId === c.id && activePanel === 'template' && (
                                            <div className="ml-6 mt-1.5 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">分類規格模板</span>
                                                <div className="text-[11px] text-gray-400 font-bold -mt-2">
                                                    這裡可以先定義這個分類常用的規格欄位，之後新增產品時就能直接帶入模板。
                                                </div>
                                                <SpecTemplateEditor
                                                    value={editSpecTemplate}
                                                    onChange={setEditSpecTemplate}
                                                />
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveSettings}
                                                        className="px-6 py-2 bg-blue-500 text-white rounded-xl text-xs font-black hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                                    >
                                                        儲存規格模板
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="px-5 py-3 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-black transition-all shadow-lg"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
}
