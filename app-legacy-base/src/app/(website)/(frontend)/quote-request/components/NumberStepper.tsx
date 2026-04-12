'use client';

import { useRef, useCallback, useEffect } from 'react';

interface NumberStepperProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

export default function NumberStepper({
    label, value, onChange, min = 1, max = 999, step = 1, unit,
}: NumberStepperProps) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clamp = (v: number) => Math.max(min, Math.min(max, v));

    const stopRepeat = useCallback(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    }, []);

    useEffect(() => () => stopRepeat(), [stopRepeat]);

    const startRepeat = (delta: number) => {
        stopRepeat();
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                onChange(clamp(value + delta));
            }, 80);
        }, 350);
    };

    const handleInput = (raw: string) => {
        if (raw === '') { onChange(min); return; }
        const n = parseInt(raw, 10);
        if (!isNaN(n)) onChange(clamp(n));
    };

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <div className="flex items-center gap-0 select-none">
                {/* Minus */}
                <button
                    type="button"
                    onClick={() => onChange(clamp(value - step))}
                    onMouseDown={() => startRepeat(-step)}
                    onMouseUp={stopRepeat}
                    onMouseLeave={stopRepeat}
                    onTouchStart={() => startRepeat(-step)}
                    onTouchEnd={stopRepeat}
                    disabled={value <= min}
                    className="w-12 h-12 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-xl font-bold text-gray-600
                               hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed
                               transition-colors flex items-center justify-center"
                >
                    −
                </button>

                {/* Value — directly editable */}
                <input
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={e => handleInput(e.target.value)}
                    className="w-20 h-12 border-2 border-gray-200 text-center text-lg font-bold text-efan-primary
                               focus:border-efan-primary focus:outline-none transition-colors"
                />

                {/* Plus */}
                <button
                    type="button"
                    onClick={() => onChange(clamp(value + step))}
                    onMouseDown={() => startRepeat(step)}
                    onMouseUp={stopRepeat}
                    onMouseLeave={stopRepeat}
                    onTouchStart={() => startRepeat(step)}
                    onTouchEnd={stopRepeat}
                    disabled={value >= max}
                    className="w-12 h-12 rounded-r-xl border-2 border-l-0 border-gray-200 bg-gray-50 text-xl font-bold text-gray-600
                               hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed
                               transition-colors flex items-center justify-center"
                >
                    +
                </button>

                {unit && <span className="ml-3 text-sm text-gray-500">{unit}</span>}
            </div>
        </div>
    );
}
