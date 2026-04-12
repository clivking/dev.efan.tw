'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
    expiryDate: string;
    onExpire?: () => void;
}

const CountdownTimer = ({ expiryDate, onExpire }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(expiryDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft(null);
                if (onExpire) onExpire();
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryDate, onExpire]);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 animate-pulse shadow-sm">
            <span className="text-orange-500 font-black text-xs uppercase tracking-tight">限時優惠倒數</span>
            <div className="flex items-center gap-1">
                {timeLeft.days > 0 && (
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-black text-orange-600 tabular-nums">{timeLeft.days}</span>
                        <span className="text-[10px] text-orange-400 font-bold">天</span>
                    </div>
                )}
                <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-black text-orange-600 tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[10px] text-orange-400 font-bold">時</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-black text-orange-600 tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[10px] text-orange-400 font-bold">分</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-black text-orange-600 tabular-nums text-orange-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[10px] text-orange-200 font-bold italic">秒</span>
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
