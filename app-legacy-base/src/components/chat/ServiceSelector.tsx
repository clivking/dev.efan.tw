'use client';

import { useState } from 'react';
import { SERVICE_LABELS } from '@/lib/types/consultation-types';
import type { ServiceType } from '@/lib/types/consultation-types';

interface ServiceSelectorProps {
    selected: ServiceType[];
    onChange: (services: ServiceType[]) => void;
    onNext: () => void;
    onTransferHuman: () => void;
    otherDescription: string;
    onOtherDescriptionChange: (desc: string) => void;
}

const SERVICE_ORDER: ServiceType[] = ['access_control', 'cctv', 'phone_system', 'attendance', 'network', 'other'];

/** Per-service accent colors */
const SERVICE_COLORS: Record<ServiceType, { bg: string; border: string; iconBg: string }> = {
    access_control: { bg: 'bg-blue-50/70', border: 'border-blue-400', iconBg: 'from-blue-100 to-blue-200' },
    cctv:           { bg: 'bg-purple-50/70', border: 'border-purple-400', iconBg: 'from-purple-100 to-purple-200' },
    phone_system:   { bg: 'bg-emerald-50/70', border: 'border-emerald-400', iconBg: 'from-emerald-100 to-emerald-200' },
    attendance:     { bg: 'bg-amber-50/70', border: 'border-amber-400', iconBg: 'from-amber-100 to-amber-200' },
    network:        { bg: 'bg-cyan-50/70', border: 'border-cyan-400', iconBg: 'from-cyan-100 to-cyan-200' },
    other:          { bg: 'bg-gray-50/70', border: 'border-gray-400', iconBg: 'from-gray-100 to-gray-200' },
};

export default function ServiceSelector({
    selected, onChange, onNext, onTransferHuman,
    otherDescription, onOtherDescriptionChange,
}: ServiceSelectorProps) {
    const toggle = (svc: ServiceType) => {
        if (selected.includes(svc)) {
            onChange(selected.filter(s => s !== svc));
        } else {
            onChange([...selected, svc]);
        }
    };

    const hasOther = selected.includes('other');

    return (
        <div className="consultation-step flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50">
            <div className="text-center mb-5 animate-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-[17px] sm:text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 mb-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    您好！我是一帆 AI 助理 👋
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide">
                    請勾選您需要的服務：（可複選）
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both px-1">
                {SERVICE_ORDER.map(svc => {
                    const label = SERVICE_LABELS[svc];
                    const colors = SERVICE_COLORS[svc];
                    const isChecked = selected.includes(svc);
                    return (
                        <button
                            key={svc}
                            type="button"
                            onClick={() => toggle(svc)}
                            className={`group flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 text-left bg-white/80 backdrop-blur-md
                                ${isChecked 
                                    ? 'border-emerald-400/80 shadow-[0_4px_15px_rgba(16,185,129,0.15)] -translate-y-1 ring-2 ring-emerald-100/50' 
                                    : 'border-slate-200/60 shadow-sm hover:shadow-md hover:border-emerald-300/50 hover:-translate-y-0.5 hover:bg-white'
                                }`}
                        >
                            <div className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 transition-transform duration-300 ${isChecked ? 'scale-110 shadow-sm' : 'group-hover:scale-105'} bg-gradient-to-br ${colors.iconBg}`}>
                                <span>{label.icon}</span>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className={`font-bold text-[12px] sm:text-[13px] leading-tight transition-colors ${isChecked ? 'text-emerald-700' : 'text-slate-700 group-hover:text-emerald-600'}`}>
                                    {label.name}
                                </span>
                            </div>
                            <div className={`w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${isChecked ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-transparent shadow-[0_2px_8px_rgba(16,185,129,0.4)] scale-110' : 'border-slate-200 bg-slate-50/50 group-hover:border-emerald-200'}`}>
                                {isChecked && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {hasOther && (
                <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300 px-1">
                    <textarea
                        value={otherDescription}
                        onChange={e => onOtherDescriptionChange(e.target.value)}
                        rows={2}
                        placeholder="請簡述您的需求，例如：舊系統維修、辦公室搬遷佈線..."
                        className="w-full p-3.5 border border-slate-200/80 rounded-xl text-[13px] text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 bg-white/80 backdrop-blur-sm shadow-sm hover:border-slate-300 resize-none placeholder:text-slate-400"
                    />
                </div>
            )}

            <div className="mt-2 text-right px-1">
                <button
                    type="button"
                    disabled={selected.length === 0}
                    onClick={onNext}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none text-[13px] sm:text-sm border border-emerald-400/20"
                >
                    下一步 →
                </button>
            </div>

            <div className="mt-auto pt-6 pb-2 text-center flex flex-col items-center">
                <div className="w-12 h-1 bg-slate-200 rounded-full mb-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"></div>
                <button
                    type="button"
                    onClick={onTransferHuman}
                    className="group px-6 py-2.5 rounded-full text-[12px] font-bold text-slate-400 hover:text-amber-600 bg-transparent border border-transparent hover:border-amber-200 hover:bg-amber-50/80 transition-all duration-300 flex items-center gap-1.5"
                >
                    <span className="text-sm group-hover:animate-bounce">👤</span> 
                    <span>轉真人服務</span>
                </button>
            </div>
        </div>
    );
}
