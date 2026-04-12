'use client';

import { useState, useRef, useEffect } from 'react';

interface EditableCellProps {
    value: string | number;
    onSave: (value: string | number) => void;
    type?: 'text' | 'number';
    multiline?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    dataTestId?: string;
}

export default function EditableCell({ value, onSave, type = 'text', multiline = false, disabled = false, className = '', placeholder = '', dataTestId }: EditableCellProps) {
    const [editing, setEditing] = useState(false);
    const [current, setCurrent] = useState(String(value ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync only when not editing or when external value changes significantly
    useEffect(() => {
        if (!editing) {
            setCurrent(String(value ?? ''));
        }
    }, [value, editing]);

    useEffect(() => {
        if (editing) {
            if (multiline && textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.select();
            } else if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }
    }, [editing, multiline]);

    const handleSave = (finalValue?: string) => {
        const valToSave = finalValue !== undefined ? finalValue : current;
        setEditing(false);

        const newVal = type === 'number' ? Number(valToSave) : valToSave;
        if (String(newVal) !== String(value)) {
            onSave(newVal);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCurrent(e.target.value);
    };

    if (disabled) {
        return <span className={`${className} text-gray-700 ${multiline ? 'whitespace-pre-wrap' : 'truncate'} block`}>{type === 'number' && (value || value === 0) ? Number(value).toLocaleString('zh-TW') : value || '-'}</span>;
    }

    if (editing) {
        if (multiline) {
            return (
                <textarea
                    ref={textareaRef}
                    data-testid={dataTestId}
                    value={current}
                    onChange={handleChange}
                    onBlur={() => handleSave()}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') { setCurrent(String(value ?? '')); setEditing(false); }
                        if (e.key === 'Tab') handleSave();
                    }}
                    className={`w-full px-2 py-1 border border-efan-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-efan-primary/30 font-bold min-h-[80px] ${className}`}
                    placeholder={placeholder}
                />
            );
        }
        return (
            <input
                ref={inputRef}
                data-testid={dataTestId}
                type={type}
                value={current}
                onChange={handleChange}
                onBlur={() => handleSave()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') { setCurrent(String(value ?? '')); setEditing(false); }
                    if (e.key === 'Tab') handleSave();
                }}
                className={`w-full px-2 py-1 border border-efan-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-efan-primary/30 font-bold ${type === 'number' ? 'text-right' : ''} ${className}`}
                placeholder={placeholder}
            />
        );
    }

    return (
        <span
            data-testid={dataTestId}
            onDoubleClick={() => setEditing(true)}
            onClick={() => setEditing(true)}
            className={`cursor-pointer hover:bg-efan-primary/5 px-2 py-1 rounded-lg transition-colors inline-block min-w-[40px] max-w-full ${multiline ? 'whitespace-pre-wrap' : 'truncate'} ${type === 'number' ? 'text-right' : ''} ${className}`}
            title="點擊編輯"
        >
            {type === 'number' && (value || value === 0) ? Number(value).toLocaleString('zh-TW') : value || <span className="text-gray-300">{placeholder || '—'}</span>}
        </span>
    );
}
