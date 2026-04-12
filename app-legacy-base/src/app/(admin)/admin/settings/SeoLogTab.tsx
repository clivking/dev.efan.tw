'use client';
import { useState, useEffect } from 'react';
import { getSeoLogs, clearSeoLogs } from './seoActions';

export default function SeoLogTab({ settingsContent }: { settingsContent: React.ReactNode }) {
    const [logsStr, setLogsStr] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const data = await getSeoLogs();
        setLogsStr(data);
        setLoading(false);
    };

    const handleClear = async () => {
        setLoading(true);
        await clearSeoLogs();
        setLogsStr('');
        setLoading(false);
    };

    let lines: string[] = [];
    if (logsStr && logsStr !== 'ERR') {
        lines = logsStr.trim().split('\n').filter(Boolean).reverse();
    }

    return (
        <div className="flex flex-col">
            {/* 這裡先渲染上方原本的 SEO 設定 (例如 GA4 ID) */}
            {settingsContent}

            {/* 這裡是新的 AI 日誌區塊 */}
            <div className="border-t border-gray-100 mt-8 pt-8 px-6 md:px-8 pb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 border-l-4 border-emerald-500 pl-3">AI 智慧轉址日誌</h3>
                        <p className="text-xs text-gray-400 mt-1 pl-4">紀錄 AI 模糊匹配以及找不到商品而發生 404 的舊網址</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={loading || lines.length === 0}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors text-xs disabled:opacity-50"
                    >
                        清空日誌
                    </button>
                </div>

                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden shadow-inner max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-100/80 sticky top-0 z-10 backdrop-blur-sm">
                            <tr className="border-b border-gray-200">
                                <th className="px-4 py-3 font-black text-gray-400 text-[10px] uppercase tracking-widest pl-6 w-[180px]">發生時間</th>
                                <th className="px-4 py-3 font-black text-gray-400 text-[10px] uppercase tracking-widest w-[160px]">判斷結果</th>
                                <th className="px-4 py-3 font-black text-gray-400 text-[10px] uppercase tracking-widest">觸發網址與詳情</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr><td colSpan={3} className="p-8 text-center text-gray-300 font-bold text-xs uppercase tracking-widest">讀取中...</td></tr>
                            ) : logsStr === 'ERR' ? (
                                <tr><td colSpan={3} className="p-8 text-center text-red-300 font-bold text-xs">讀取失敗</td></tr>
                            ) : lines.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                                        <div className="text-3xl mb-2 opacity-50">📭</div>
                                        <div className="text-xs font-bold uppercase tracking-widest">目前沒有任何轉址紀錄</div>
                                    </td>
                                </tr>
                            ) : lines.map((line, i) => {
                                const match = line.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
                                if (!match) {
                                    return (
                                        <tr key={i}>
                                            <td colSpan={3} className="px-6 py-3 text-xs text-gray-500 font-mono">{line}</td>
                                        </tr>
                                    );
                                }
                                const [, timeStr, status, detail] = match;
                                let formattedTime = timeStr;
                                try { formattedTime = new Date(timeStr).toLocaleString('zh-TW', { hour12: false }); } catch (e) {}
                                const isSuccess = status === 'AI_SUCCESS';

                                return (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-4 py-3 text-gray-400 text-[11px] pl-6 font-mono">{formattedTime}</td>
                                        <td className="px-4 py-3 text-[11px]">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full font-black border ${isSuccess ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {isSuccess ? '✅ 成功轉址' : '❌ 404 死路'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-gray-700 break-all pr-6">
                                            {detail}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
