"use client";

import { useState, useEffect } from 'react';

export default function ServerStatusBadge() {
    const [status, setStatus] = useState<'ONLINE' | 'STANDBY'>('ONLINE');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/public/business-hours', { cache: 'no-store' });
                if (!res.ok) {
                    throw new Error('Failed to fetch business hours');
                }

                const data = await res.json();
                setStatus(data.isOpen ? 'ONLINE' : 'STANDBY');
            } catch {
                // Fallback to Taipei weekday office hours if the API is temporarily unavailable.
                const now = new Date();
                const taipeiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
                const day = taipeiTime.getDay();
                const hour = taipeiTime.getHours();
                const isWeekday = day >= 1 && day <= 5;
                const isWorkingHour = hour >= 9 && hour < 18;

                setStatus(isWeekday && isWorkingHour ? 'ONLINE' : 'STANDBY');
            }
        };

        void checkStatus();
        const interval = setInterval(() => {
            void checkStatus();
        }, 600000);

        return () => clearInterval(interval);
    }, []);

    if (!isMounted) {
        return (
            <span className="flex items-center gap-2 text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 營業中
            </span>
        );
    }

    if (status === 'ONLINE') {
        return (
            <span className="flex items-center gap-2 text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 transition-all duration-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> 營業中
            </span>
        );
    }

    return (
        <span className="flex items-center gap-2 text-xs font-bold bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 transition-all duration-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-60"></span> 非營業時間
        </span>
    );
}
