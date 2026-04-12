'use client';

import { useRef, useCallback, useEffect } from 'react';

interface StepperInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    hint?: string;
    unit?: string;
}

export default function StepperInput({
    value,
    onChange,
    min = 1,
    max = 999,
    step = 1,
    label,
    hint,
    unit,
}: StepperInputProps) {
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
        <div className="stepper-input-group">
            {label && <span className="stepper-label">{label}</span>}
            <div className="stepper-row">
                <div className="stepper-control">
                    <button
                        type="button"
                        className="stepper-btn stepper-btn-minus"
                        onClick={() => onChange(clamp(value - step))}
                        onMouseDown={() => startRepeat(-step)}
                        onMouseUp={stopRepeat}
                        onMouseLeave={stopRepeat}
                        onTouchStart={() => startRepeat(-step)}
                        onTouchEnd={stopRepeat}
                        disabled={value <= min}
                        aria-label="減少"
                    >
                        −
                    </button>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        onChange={e => handleInput(e.target.value)}
                        className="stepper-value-input"
                    />
                    <button
                        type="button"
                        className="stepper-btn stepper-btn-plus"
                        onClick={() => onChange(clamp(value + step))}
                        onMouseDown={() => startRepeat(step)}
                        onMouseUp={stopRepeat}
                        onMouseLeave={stopRepeat}
                        onTouchStart={() => startRepeat(step)}
                        onTouchEnd={stopRepeat}
                        disabled={value >= max}
                        aria-label="增加"
                    >
                        +
                    </button>
                </div>
                {unit && <span className="stepper-unit">{unit}</span>}
            </div>
            {hint && <span className="stepper-hint">{hint}</span>}
        </div>
    );
}
