import React, { useState } from 'react';
import { toast } from 'sonner';

interface Variant {
    id: string;
    name: string;
    isRecommended: boolean;
    sortOrder: number;
    subtotalAmount: string;
    totalAmount: string;
}

interface VariantTabBarProps {
    quoteId: string;
    variants: Variant[];
    activeVariantId: string | null; // null = shared items
    onTabChange: (id: string | null) => void;
    onRefresh: () => void;
    disabled?: boolean;
}

export default function VariantTabBar({ quoteId, variants, activeVariantId, onTabChange, onRefresh, disabled }: VariantTabBarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleAdd = async () => {
        try {
            const res = await fetch(`/api/quotes/${quoteId}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `方案 ${variants.length + 1}` }),
            });
            if (res.ok) {
                toast.success('已新增方案');
                onRefresh();
            }
        } catch (e) { toast.error('新增失敗'); }
    };

    const handleRename = async (vid: string) => {
        if (!editName.trim()) return setEditingId(null);
        try {
            const res = await fetch(`/api/quotes/${quoteId}/variants/${vid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName }),
            });
            if (res.ok) {
                onRefresh();
                setEditingId(null);
            }
        } catch (e) { toast.error('重新命名失敗'); }
    };

    const handleSetRecommended = async (vid: string) => {
        try {
            const res = await fetch(`/api/quotes/${quoteId}/variants/${vid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRecommended: true }),
            });
            if (res.ok) onRefresh();
        } catch (e) { toast.error('設定推薦失敗'); }
    };

    const handleDelete = async (vid: string) => {
        const isLast = variants.length === 1;
        const msg = isLast
            ? '刪除最後一個方案將回到傳統模式。方案專屬品項也會一併刪除。確定嗎？'
            : '確定要刪除此方案嗎？相關品項也會一併刪除。';

        if (!window.confirm(msg)) return;

        try {
            const res = await fetch(`/api/quotes/${quoteId}/variants/${vid}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('方案已刪除');
                if (activeVariantId === vid) onTabChange(null);
                onRefresh();
            }
        } catch (e) { toast.error('刪除失敗'); }
    };

    return (
        <div className="flex items-center gap-1 border-b border-gray-100 px-4 pt-4 bg-gray-50/30">
            {/* Shared Items Tab */}
            <button
                onClick={() => onTabChange(null)}
                className={`px-6 py-3 text-sm font-black rounded-t-2xl transition-all ${activeVariantId === null
                        ? 'bg-white text-efan-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                共用項目
            </button>

            {/* Variant Tabs */}
            {variants.map((v) => (
                <div
                    key={v.id}
                    className={`group relative flex items-center rounded-t-2xl transition-all ${activeVariantId === v.id
                            ? 'bg-white shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]'
                            : 'hover:bg-gray-100/50'
                        }`}
                >
                    {editingId === v.id ? (
                        <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleRename(v.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(v.id)}
                            className="px-6 py-3 text-sm font-black bg-transparent border-none focus:ring-0 w-32"
                        />
                    ) : (
                        <div className="flex items-center">
                            <button
                                onClick={() => onTabChange(v.id)}
                                onDoubleClick={() => {
                                    setEditingId(v.id);
                                    setEditName(v.name);
                                }}
                                className={`px-6 py-3 text-sm font-black flex items-center gap-2 ${activeVariantId === v.id ? 'text-efan-primary' : 'text-gray-400'
                                    }`}
                            >
                                {v.name}
                                {v.isRecommended && <span title="推薦方案">⭐</span>}
                            </button>

                            {/* Action Menu (Visible on hover or if active) */}
                            <div className="flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!v.isRecommended && (
                                    <button
                                        onClick={() => handleSetRecommended(v.id)}
                                        className="p-1 text-gray-300 hover:text-amber-400 text-xs"
                                        title="設為推薦"
                                    >
                                        ⭐
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(v.id)}
                                    className="p-1 text-gray-300 hover:text-red-500 text-xs"
                                    title="刪除方案"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Add Button */}
            {!disabled && variants.length < 5 && (
                <button
                    onClick={handleAdd}
                    className="ml-2 p-2 text-gray-300 hover:text-efan-primary hover:bg-white rounded-full transition-all"
                    title="新增方案"
                >
                    <span className="text-xl font-bold">+</span>
                </button>
            )}
        </div>
    );
}
