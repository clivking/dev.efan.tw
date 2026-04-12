'use client';

import React from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface ViewRecord {
    id: string;
    createdAt: string;
    deviceType: string;
    durationSeconds: number;
    ipAddress: string;
}

interface QuoteViewHistoryProps {
    viewData: {
        summary: {
            totalViews: number;
            lastViewedAt: string | null;
            averageDuration: number;
            devices: { mobile: number; desktop: number; tablet: number };
        };
        views: ViewRecord[];
    } | null;
}

const QuoteViewHistory = ({ viewData }: QuoteViewHistoryProps) => {
    if (!viewData || viewData.summary.totalViews === 0) {
        return (
            <div className="p-8 border-b border-gray-100 bg-gray-50/10">
                <div className="max-w-4xl">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        報價單點閱紀錄
                    </label>
                    <div className="text-sm text-gray-400 font-medium bg-white/50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                        尚無瀏覽紀錄
                    </div>
                </div>
            </div>
        );
    }

    const { summary, views } = viewData;

    return (
        <div className="p-8 border-b border-gray-100 bg-gray-50/10">
            <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        報價單點閱紀錄
                    </label>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="text-xl font-black text-indigo-600">{summary.totalViews}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">總點閱</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-black text-indigo-600">{summary.averageDuration}s</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">平均停留</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {views.slice(0, 5).map((view) => (
                        <div key={view.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-50 hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">
                                    {view.deviceType.toLowerCase().includes('mobile') ? '📱' : '💻'}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-gray-700">
                                        {format(new Date(view.createdAt), 'yyyy/MM/dd HH:mm:ss', { locale: zhTW })}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold">
                                        IP: {view.ipAddress} • 停留 {view.durationSeconds} 秒
                                    </div>
                                </div>
                            </div>
                            <div className="text-[10px] font-black px-2 py-1 rounded-md bg-indigo-50 text-indigo-400 uppercase">
                                {view.deviceType}
                            </div>
                        </div>
                    ))}
                    {views.length > 5 && (
                        <div className="text-center pt-2">
                            <span className="text-xs text-gray-400 font-bold">僅顯示最近 5 筆紀錄</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuoteViewHistory;
