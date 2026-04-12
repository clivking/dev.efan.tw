'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

export default function ProductImportModal({ onSuccess, onClose }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'upload' | 'preview' | 'result'>('upload');
    const [result, setResult] = useState<{ success: number; failure: number } | null>(null);

    const handlePreview = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', 'preview');

        try {
            const res = await fetch('/api/products/import', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                return;
            }
            setPreviewData(data.previewData || []);
            setMode('preview');
        } catch (e) {
            toast.error('預覽匯入資料失敗');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('mode', 'confirm');
        formData.append('data', JSON.stringify(previewData));

        try {
            const res = await fetch('/api/products/import', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setResult({ success: data.successCount, failure: data.errorCount });
            setMode('result');
            onSuccess();
        } catch (e) {
            toast.error('匯入產品失敗');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-efan-primary">匯入產品資料</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors font-bold text-gray-400">✕</button>
                </div>

                {mode === 'upload' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-10">
                        <label className="w-full max-w-2xl border-4 border-dashed border-gray-100 rounded-[40px] p-20 hover:border-efan-primary/30 hover:bg-efan-primary/5 transition-all cursor-pointer group text-center">
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📦</div>
                            <div className="text-xl font-black text-gray-700 mb-2">
                                {file ? file.name : '點擊這裡選擇要匯入的 Excel 檔案'}
                            </div>
                            <p className="text-sm font-bold text-gray-400">系統會先顯示預覽資料，確認無誤後再正式匯入產品清單。</p>
                        </label>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="px-8 py-4 font-bold text-gray-400 hover:text-gray-600">取消匯入</button>
                            <button
                                disabled={!file || loading}
                                onClick={handlePreview}
                                className="px-12 py-4 rounded-2xl bg-efan-primary text-white font-black hover:bg-efan-primary-dark transition-all disabled:opacity-30 shadow-xl shadow-efan-primary/20"
                            >
                                {loading ? '讀取中...' : '預覽匯入內容'}
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'preview' && (
                    <div className="flex-1 flex flex-col min-h-0 space-y-6">
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold text-sm">
                            目前預覽 {previewData.length} 筆資料，請確認欄位與金額都正確後再正式匯入。
                        </div>

                        <div className="flex-1 overflow-auto border border-gray-100 rounded-2xl shadow-inner bg-gray-50/30">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <tr>
                                        <th className="px-4 py-4 border-b">分類</th>
                                        <th className="px-4 py-4 border-b">品牌 / 型號</th>
                                        <th className="px-4 py-4 border-b text-right">成本</th>
                                        <th className="px-4 py-4 border-b text-right">售價</th>
                                        <th className="px-4 py-4 border-b text-center">型態</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewData.map((p, i) => (
                                        <tr key={i} className="bg-white hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-4">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-500">{p.categoryName}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-700">{p.name}</div>
                                                <div className="text-[10px] font-mono text-gray-400">{p.brand} {p.model}</div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-gray-400">${p.costPrice?.toLocaleString()}</td>
                                            <td className="px-4 py-4 text-right font-mono font-bold text-efan-primary">${p.sellingPrice?.toLocaleString()}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.type === 'bundle' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                    {p.type === 'bundle' ? '組合包' : '單品'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <button
                                onClick={() => setMode('upload')}
                                className="font-bold text-gray-400 hover:text-gray-600 flex items-center gap-2"
                            >
                                返回重新選檔
                            </button>
                            <button
                                disabled={loading}
                                onClick={handleConfirm}
                                className="px-16 py-4 rounded-2xl bg-efan-primary text-white font-black hover:bg-efan-primary-dark transition-all disabled:opacity-30 shadow-2xl shadow-efan-primary/30"
                            >
                                {loading ? '正在匯入產品資料...' : '確認匯入資料'}
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'result' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-5xl">✓</div>
                        <div className="text-center space-y-2">
                            <h3 className="text-4xl font-black text-gray-800">匯入完成</h3>
                            <p className="text-gray-500 font-bold text-lg">
                                成功匯入 <span className="text-green-600">{result?.success}</span> 筆，
                                失敗 <span className="text-red-500">{result?.failure}</span> 筆。
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-12 py-4 rounded-2xl bg-gray-800 text-white font-black hover:bg-black transition-all shadow-xl"
                        >
                            關閉視窗
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
