'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface QuoteInteractionPanelProps {
    quoteId: string;
    status: string;
    onChangeStatus?: (newStatus: string) => void;
}

const VISIBLE_STATUSES = ['confirmed', 'sent', 'signed', 'construction', 'completed', 'paid', 'closed'];

export default function QuoteInteractionPanel({ quoteId, status, onChangeStatus }: QuoteInteractionPanelProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [closeReason, setCloseReason] = useState('');
    const [closing, setClosing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/quotes/${quoteId}/views`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [quoteId]);

    useEffect(() => {
        if (VISIBLE_STATUSES.includes(status)) {
            fetchData();
        }
    }, [fetchData, status]);

    const handleGenerateToken = async () => {
        if (data?.token && !window.confirm('目前已有一組對外連結，確定要重新產生嗎？')) return;

        setGenerating(true);
        try {
            const res = await fetch(`/api/quotes/${quoteId}/generate-token`, { method: 'POST' });
            if (res.ok) {
                toast.success('已產生新的對外連結');
                fetchData();
            } else {
                toast.error('產生對外連結失敗');
            }
        } catch (e) {
            toast.error('連線失敗');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!data?.token?.url) return;
        navigator.clipboard.writeText(data.token.url);
        setCopied(true);
        toast.success('已複製對外連結');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!VISIBLE_STATUSES.includes(status)) {
        return null;
    }

    const handleMarkAsClosed = async () => {
        setClosing(true);
        try {
            const res = await fetch(`/api/quotes/${quoteId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'closed', closeReason }),
            });

            if (res.ok) {
                toast.success('案件已標記為作廢');
                setIsCloseDialogOpen(false);
                if (onChangeStatus) onChangeStatus('closed');
                else window.location.reload();
            } else {
                toast.error('作廢失敗');
            }
        } catch (e) {
            toast.error('連線失敗');
        } finally {
            setClosing(false);
        }
    };

    if (loading) {
        return <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center text-sm font-bold text-gray-400 shadow-sm">載入互動資訊中...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">案件狀態</h3>
                </div>
                <select
                    value={status}
                    onChange={(e) => {
                        if (onChangeStatus) {
                            onChangeStatus(e.target.value);
                        } else {
                            fetch(`/api/quotes/${quoteId}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: e.target.value }),
                            }).then(() => window.location.reload());
                        }
                    }}
                    className="w-full cursor-pointer rounded-xl border-none bg-gray-50 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-efan-primary"
                >
                    <option value="draft">草稿</option>
                    <option value="confirmed">已確認</option>
                    <option value="sent">已送出</option>
                    <option value="signed">已簽回</option>
                    <option value="construction">施工中</option>
                    <option value="completed">已完工</option>
                    <option value="paid">已付款</option>
                    <option value="closed">作廢</option>
                </select>
                {status === 'confirmed' && (
                    <p className="mt-2 text-xs font-bold text-orange-500">
                        建議下一步先產生對外連結，再送給客戶確認。
                    </p>
                )}
                {status !== 'closed' && ['sent', 'signed', 'construction', 'completed', 'paid'].includes(status) && (
                    <button
                        onClick={() => setIsCloseDialogOpen(true)}
                        className="mt-3 w-full rounded-xl border-2 border-dashed border-gray-200 py-2 text-xs font-bold text-gray-400 transition-all hover:border-red-200 hover:text-red-400"
                    >
                        標記為作廢
                    </button>
                )}
            </div>

            {isCloseDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <h3 className="mb-2 text-xl font-black text-gray-800">作廢案件</h3>
                            <p className="mb-6 text-sm font-medium text-gray-400">可留下原因，方便後續回頭查詢。</p>

                            <div className="space-y-4">
                                <textarea
                                    className="h-32 w-full resize-none rounded-2xl border-none bg-gray-50 p-4 text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-efan-primary"
                                    placeholder="例如：客戶取消、預算不足、重開新案號..."
                                    value={closeReason}
                                    onChange={(e) => setCloseReason(e.target.value)}
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsCloseDialogOpen(false)}
                                        className="flex-1 rounded-2xl py-3 font-bold text-gray-400 transition-all hover:bg-gray-100"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleMarkAsClosed}
                                        disabled={closing}
                                        className="flex-1 rounded-2xl bg-red-500 py-3 font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-600 disabled:opacity-50"
                                    >
                                        {closing ? '處理中...' : '確認作廢'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {status !== 'confirmed' && (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">對外連結</h3>

                    {data?.token ? (
                        <div className="space-y-3">
                            <div className="break-all rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs font-medium text-gray-600">
                                {data.token.url}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex-1 rounded-xl bg-indigo-50 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
                                >
                                    {copied ? '已複製' : '複製連結'}
                                </button>
                                <button
                                    onClick={handleGenerateToken}
                                    disabled={generating}
                                    className="flex-1 rounded-xl bg-gray-50 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
                                >
                                    {generating ? '產生中...' : '重新產生'}
                                </button>
                            </div>

                            <div className="mt-2 text-[10px] text-gray-400">
                                <p>建立時間：{new Date(data.token.createdAt).toLocaleString('zh-TW', { hour12: false })}</p>
                                <p>狀態：{data.token.isActive ? '啟用中' : '已停用'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="mb-3 text-xs text-gray-500">目前尚未產生可分享給客戶的連結。</p>
                            <button
                                onClick={handleGenerateToken}
                                disabled={generating}
                                className="w-full rounded-xl bg-efan-primary py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {generating ? '產生中...' : '產生對外連結'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {data?.summary?.firstViewedAt && (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">客戶瀏覽紀錄</h3>

                    <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs">
                        <div className="text-gray-500">總瀏覽次數：<span className="font-bold text-gray-900">{data.summary.totalViews} 次</span></div>
                        <div className="text-gray-500">平均停留：<span className="font-bold text-gray-900">{Math.round(data.summary.averageDuration)} 秒</span></div>
                        <div className="col-span-2 text-gray-500">首次瀏覽：<span className="font-medium text-gray-900">{new Date(data.summary.firstViewedAt).toLocaleString('zh-TW', { hour12: false, minute: '2-digit' })}</span></div>
                        <div className="col-span-2 text-gray-500">最近瀏覽：<span className="font-medium text-gray-900">{new Date(data.summary.lastViewedAt).toLocaleString('zh-TW', { hour12: false, minute: '2-digit' })}</span></div>
                    </div>

                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                        <h4 className="text-[10px] font-bold uppercase text-gray-400">明細紀錄</h4>
                        {data.views?.map((view: any, i: number) => (
                            <div key={i} className="flex items-center justify-between border-b border-gray-50 py-1 text-[11px] last:border-0">
                                <div className="flex items-center gap-1.5">
                                    <span title={view.deviceType}>
                                        {view.deviceType === 'mobile' ? '手機' : view.deviceType === 'tablet' ? '平板' : '桌機'}
                                    </span>
                                    <span className="text-gray-500">
                                        {new Date(view.createdAt).toLocaleDateString('zh-TW').slice(5)} {new Date(view.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">
                                        {view.durationSeconds > 60
                                            ? `${Math.floor(view.durationSeconds / 60)} 分 ${view.durationSeconds % 60} 秒`
                                            : `${view.durationSeconds} 秒`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
