'use client';

import { useState } from 'react';

interface Props {
    targetId: string;
    targetName: string;
    onSuccess: () => void;
}

export default function MergeDialog({ targetId, targetName, onSuccess }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [source, setSource] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!search) return;
        const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (data && data.customers) {
            setResults(data.customers.filter((c: any) => c.id !== targetId));
        } else {
            setResults([]);
        }
    };

    const handleMerge = async () => {
        if (!source) return;
        if (!confirm(`確定將 ${source.primaryCompanyName || source.primaryContact} 的所有資料合併到 ${targetName}？此操作不可逆，來源客戶將被標記為已刪除。`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/customers/${targetId}/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceCustomerId: source.id }),
            });
            if (res.ok) {
                setIsOpen(false);
                onSuccess();
            } else {
                alert('合併失敗');
            }
        } catch (e) {
            console.error(e);
            alert('發生錯誤');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-100 text-orange-700 font-bold text-sm hover:bg-orange-200"
            >
                🔗 客戶合併
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-xl w-full space-y-6">
                <h2 className="text-2xl font-black text-efan-primary">合併客戶資料</h2>
                <p className="text-sm text-gray-500 font-medium">請搜尋並選擇要「被合併」進來的來源客戶。該客戶的聯絡人與案場將全數轉移至 <strong>{targetName}</strong>。</p>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="搜尋來源客戶..."
                        className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-efan-primary font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="px-6 py-3 rounded-xl bg-efan-primary text-white font-bold"
                    >
                        搜尋
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 rounded-2xl p-2">
                    {results.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setSource(r)}
                            className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${source?.id === r.id ? 'bg-efan-primary text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                            <div>
                                <div className="font-bold">{r.primaryCompanyName || '個人客戶'}</div>
                                <div className={`text-xs ${source?.id === r.id ? 'text-white/60' : 'text-gray-400'}`}>{r.customerNumber} - {r.primaryContact}</div>
                            </div>
                            {source?.id === r.id && <span>✓</span>}
                        </button>
                    ))}
                    {results.length === 0 && search && <div className="p-8 text-center text-gray-400 text-sm font-bold">查無可合併的客戶</div>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-6 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                    >
                        取消
                    </button>
                    <button
                        disabled={!source || loading}
                        onClick={handleMerge}
                        className="px-6 py-4 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-30"
                    >
                        {loading ? '合併中...' : '確認執行合併'}
                    </button>
                </div>
            </div>
        </div>
    );
}
