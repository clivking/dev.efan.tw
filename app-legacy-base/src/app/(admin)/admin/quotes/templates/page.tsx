'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Template {
    id: string;
    name: string;
    category: { name: string } | null;
    notes: string | null;
    _count: { items: number };
    createdAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (e) {
            console.error(e);
            toast.error('讀取模板失敗');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    const handleDelete = async (id: string) => {
        if (!confirm('確定刪除此模板？')) return;
        try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('已刪除'); fetchTemplates(); }
            else toast.error('刪除失敗');
        } catch (e) { toast.error('發生錯誤'); }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-efan-primary tracking-tight mb-2">模板管理</h1>
                <p className="text-gray-500 font-medium tracking-tight">管理報價模板，從報價單存為模板後可在此管理。</p>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-efan-primary"></div>
                    <span className="text-gray-400 font-bold animate-pulse">載入中...</span>
                </div>
            ) : templates.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300 font-bold">
                    尚無模板，從報價工作台「存為模板」即可建立
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">模板名稱</th>
                                <th className="text-left px-5 py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">分類</th>
                                <th className="text-center px-5 py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">項目數</th>
                                <th className="text-left px-5 py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">備註</th>
                                <th className="text-left px-5 py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">建立日期</th>
                                <th className="text-right px-5 py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(t => (
                                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 font-bold text-gray-700">{t.name}</td>
                                    <td className="px-5 py-4 text-gray-500">{t.category?.name || '-'}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{t._count.items}</span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-400 text-xs truncate max-w-40">{t.notes || '-'}</td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString('zh-TW')}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button onClick={() => handleDelete(t.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-colors text-xs">🗑️ 刪除</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
