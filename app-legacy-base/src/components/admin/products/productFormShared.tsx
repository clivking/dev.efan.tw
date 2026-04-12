'use client';

import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl p-4 border border-blue-50/50 shadow-xl shadow-blue-900/5 relative overflow-hidden group ${className}`}>
            {children}
        </div>
    );
}

export function SectionHeader({ icon, number, title }: { icon?: string; number?: string; title: string }) {
    return (
        <h2 className="text-lg font-black text-gray-800 mb-3 tracking-tight flex items-center gap-2">
            {number && (
                <span className="w-8 h-8 bg-efan-primary text-white rounded-xl flex items-center justify-center text-xs">{number}</span>
            )}
            {icon && !number && <span>{icon}</span>}
            {title}
        </h2>
    );
}

export function Label({ children }: { children: ReactNode }) {
    return <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-3">{children}</label>;
}

export const inputClass = 'w-full px-6 py-4 bg-gray-50/50 rounded-2xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-black text-gray-800 placeholder:text-gray-300';
export const inputSmClass = 'w-full px-4 py-3 bg-gray-50/50 rounded-xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm shadow-sm';

export function listToTextarea(value: unknown): string {
    return Array.isArray(value) ? value.map((item) => String(item)).join('\n') : '';
}

export function textareaToList(value: string): string[] {
    return value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
}
