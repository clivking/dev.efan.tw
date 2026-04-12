'use client';

import { useState } from 'react';

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

export default function ImportModal({ onSuccess, onClose }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [errorCount, setErrorCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'upload' | 'preview' | 'result'>('upload');
    const [result, setResult] = useState<{ success: number; failure: number } | null>(null);

    const handlePreview = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/customers/import?mode=preview', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            setPreviewData(data.previewData || []);
            setErrorCount(data.errorCount || 0);
            setMode('preview');
        } catch (e) {
            alert('解析失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/customers/import?mode=confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: previewData }),
            });
            const data = await res.json();
            setResult({ success: data.successCount, failure: data.failureCount });
            setMode('result');
            onSuccess();
        } catch (e) {
            alert('匯入失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
                <h2 className="text-2xl font-black text-efan-primary">批次匯入客戶</h2>

                {mode === 'upload' && (
                    <div className="space-y-6 py-10 text-center">
                        <label className="block w-full border-4 border-dashed border-gray-100 rounded-[40px] p-20 hover:border-efan-primary/30 hover:bg-efan-primary/5 transition-all cursor-pointer group">
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                            <div className="text-xl font-black text-gray-500 mb-2">
                                {file ? file.name : '點擊或拖拉 Excel 檔案至此'}
                            </div>
                            <div className="text-sm font-bold text-gray-400">僅支援專用的 .xlsx 匯入模板</div>
                        </label>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={onClose} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600">取消</button>
                            <button
                                disabled={!file || loading}
                                onClick={handlePreview}
                                className="px-8 py-3 rounded-2xl bg-efan-primary text-white font-black hover:bg-efan-primary-dark transition-all disabled:opacity-30 shadow-lg shadow-efan-primary/20"
                            >
                                {loading ? '解析中...' : '下一步：預覽資料'}
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'preview' && (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-2xl font-bold flex items-center justify-between ${errorCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                            <span>預覽結果：共 {previewData.length} 筆資料，發現 {errorCount} 個格式錯誤。</span>
                            {errorCount === 0 && <span>✅ 格式檢查通過</span>}
                        </div>

                        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Temp ID</th>
                                        <th className="px-4 py-3">客戶公司/聯絡人</th>
                                        <th className="px-4 py-3 text-center">子項目</th>
                                        <th className="px-4 py-3">驗證狀態</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {previewData.map((p, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-4 font-mono text-xs">{p.temp_id}</td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold">{p.companyNames[0]?.company_name || p.contacts[0]?.name || '未命名'}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                                    {p.companyNames.length}C / {p.contacts.length}P / {p.locations.length}L
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {p.errors.length > 0 ? (
                                                    <div className="text-red-500 text-xs font-bold leading-tight">
                                                        {p.errors.map((e: string, i: number) => <div key={i}>{e}</div>)}
                                                    </div>
                                                ) : (
                                                    <span className="text-green-500 text-xs font-black">OK</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <button
                                onClick={() => setMode('upload')}
                                className="font-bold text-gray-400 hover:text-gray-600"
                            >
                                ← 返回上傳
                            </button>
                            <button
                                disabled={errorCount > 0 || loading}
                                onClick={handleConfirm}
                                className="px-12 py-4 rounded-2xl bg-efan-primary text-white font-black hover:bg-efan-primary-dark transition-all disabled:opacity-30 shadow-xl shadow-efan-primary/20"
                            >
                                {loading ? '匯入中...' : '確認匯入系統'}
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'result' && (
                    <div className="py-20 text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="text-7xl">🎉</div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-efan-primary">匯入作業已完成</h3>
                            <p className="text-gray-500 font-medium">總結：成功 {result?.success} 筆，失敗 {result?.failure} 筆。</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-10 py-4 rounded-2xl bg-efan-primary text-white font-black hover:bg-efan-primary-dark shadow-xl"
                        >
                            關閉視窗
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
