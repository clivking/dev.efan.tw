'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatusFunnelProps {
    loading: boolean;
    data: {
        draft: number;
        confirmed: number;
        sent: number;
        signed: number;
        construction: number;
        completed: number;
        paid: number;
    };
}

export default function StatusFunnel({ loading, data }: StatusFunnelProps) {
    const steps = [
        { key: 'draft', label: '草稿', color: 'bg-gray-400', textColor: 'text-gray-400' },
        { key: 'confirmed', label: '已確認', color: 'bg-blue-500', textColor: 'text-blue-500' },
        { key: 'sent', label: '已送出', color: 'bg-orange-500', textColor: 'text-orange-500' },
        { key: 'signed', label: '已回簽', color: 'bg-green-500', textColor: 'text-green-500' },
        { key: 'construction', label: '施工中', color: 'bg-purple-500', textColor: 'text-purple-500' },
        { key: 'completed', label: '已完工', color: 'bg-indigo-500', textColor: 'text-indigo-500' },
        { key: 'paid', label: '已付款', color: 'bg-amber-500', textColor: 'text-amber-500' },
    ];

    const maxCount = Math.max(...Object.values(data), 1);

    return (
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-black text-efan-primary mb-8 flex items-center gap-2">
                <span>📊</span> 報價狀態分布
            </h3>

            <div className="space-y-5 flex-1 flex flex-col justify-center">
                {steps.map((step) => {
                    const count = (data as any)[step.key] || 0;
                    const percentage = (count / maxCount) * 100;

                    return (
                        <div key={step.key} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                                <span className={step.textColor}>{step.label}</span>
                                <span className="text-efan-primary font-mono text-sm">{count}</span>
                            </div>
                            <div className="h-3.5 bg-gray-50 rounded-full overflow-hidden flex items-center">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000", step.color)}
                                    style={{ width: loading ? '0%' : `${Math.max(percentage, 2)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    總計累計報價流程狀態
                </p>
            </div>
        </div>
    );
}
