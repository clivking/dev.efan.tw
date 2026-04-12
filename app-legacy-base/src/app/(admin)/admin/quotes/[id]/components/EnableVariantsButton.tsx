import React, { useState } from 'react';
import { toast } from 'sonner';

interface EnableVariantsButtonProps {
    quoteId: string;
    onEnabled: () => void;
    disabled?: boolean;
}

export default function EnableVariantsButton({ quoteId, onEnabled, disabled }: EnableVariantsButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleEnable = async () => {
        if (!window.confirm('啟用多方案後，目前的品項將成為共用項目（每方案都包含）。確定啟用嗎？')) return;

        setLoading(true);
        try {
            // 建第一個方案
            const res = await fetch(`/api/quotes/${quoteId}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '經濟款' }),
            });

            if (res.ok) {
                toast.success('已啟用多方案模式');
                onEnabled();
            } else {
                const err = await res.json();
                toast.error(err.error || '啟用失敗');
            }
        } catch (e) {
            toast.error('發生錯誤');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleEnable}
            disabled={disabled || loading}
            className={`px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
        >
            {loading ? '⏳ 處理中...' : '📋 啟用多方案'}
        </button>
    );
}
