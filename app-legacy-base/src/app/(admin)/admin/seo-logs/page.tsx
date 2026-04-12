import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function SeoLogsPage() {
    const logPath = path.join(process.cwd(), 'logs', 'seo-redirects.log');
    let logs = '';
    try {
        if (fs.existsSync(logPath)) {
            logs = fs.readFileSync(logPath, 'utf8');
        } else {
            logs = '尚未產生任何日誌。';
        }
    } catch (e) {
        logs = '無法讀取日誌檔案。';
    }

    // 將每一行日誌反轉，讓最新的顯示在最上方
    const lines = logs.trim().split('\n').filter(Boolean).reverse();

    async function clearLogs() {
        'use server';
        try {
            const fs = require('fs');
            const path = require('path');
            const p = path.join(process.cwd(), 'logs', 'seo-redirects.log');
            if (fs.existsSync(p)) fs.unlinkSync(p);
            revalidatePath('/admin/seo-logs');
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">SEO 智能轉址日誌</h1>
                    <p className="text-sm text-gray-500 mt-1">紀錄 AI 模糊匹配以及找不到商品而發生 404 的舊網址</p>
                </div>
                <form action={clearLogs}>
                    <button type="submit" className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors text-sm">
                        清空日誌
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">發生時間</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[180px]">處理結果</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">觸發網址與詳情</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {lines.map((line, i) => {
                            // 解析格式: [2026-03-28T10:35:00] [AI_SUCCESS] ar727h-v5 -> ar-727-e (Score: 0.91)
                            const match = line.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
                            if (!match) {
                                return (
                                    <tr key={i}>
                                        <td colSpan={3} className="px-6 py-4 text-sm text-gray-500">{line}</td>
                                    </tr>
                                );
                            }

                            const [, timeStr, status, detail] = match;
                            let formattedTime = timeStr;
                            try {
                                formattedTime = new Date(timeStr).toLocaleString('zh-TW', { hour12: false });
                            } catch (e) {}

                            const isSuccess = status === 'AI_SUCCESS';

                            return (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {formattedTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {isSuccess ? '✅ AI 成功轉址' : '❌ 404 死路'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 font-mono break-all">
                                        {detail}
                                    </td>
                                </tr>
                            );
                        })}
                        {lines.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    <div className="text-4xl mb-3">📭</div>
                                    目前沒有任何轉址異常紀錄
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
