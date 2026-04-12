'use client';

import { useState } from 'react';
import {
    ACTIVITY_OPTIONS,
    COMPRESSION_OPTIONS,
    FPS_OPTIONS,
    HOURS_PER_DAY_OPTIONS,
    RECORDING_MODE_OPTIONS,
    RESOLUTION_OPTIONS,
} from '@/lib/cctv-capacity-presets';
import type { ActivityLevel, CompressionFormat, RecordingMode, ResolutionOption } from '@/lib/cctv-capacity-presets';
import type { BitrateMode } from '@/lib/cctv-capacity';

export interface CalculatorFormState {
    cameraCount: number;
    resolution: ResolutionOption;
    compression: CompressionFormat;
    fps: number;
    hoursPerDay: number;
    retentionDays: number;
    driveCapacityTb: number;
    bitrateMode: BitrateMode;
    manualBitrateMbps: number;
    activityLevel: ActivityLevel;
    recordingMode: RecordingMode;
    safetyMargin: number;
}

interface Props {
    mode: 'storage' | 'retention';
    value: CalculatorFormState;
    onChange: (next: CalculatorFormState) => void;
}

function NumberField({
    label,
    value,
    min,
    max,
    step = 1,
    suffix,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max?: number;
    step?: number;
    suffix?: string;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
            <div className="relative">
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-slate-900 shadow-sm outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/10"
                />
                {suffix ? <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">{suffix}</span> : null}
            </div>
        </label>
    );
}

function SelectField<T extends string | number>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: Array<{ value: T; label: string }>;
    onChange: (value: T) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange((typeof value === 'number' ? Number(event.target.value) : event.target.value) as T)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/10"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function CctvCapacityForm({ mode, value, onChange }: Props) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const update = <K extends keyof CalculatorFormState,>(key: K, nextValue: CalculatorFormState[K]) => {
        onChange({
            ...value,
            [key]: nextValue,
        });
    };

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <NumberField label="攝影機數量" value={value.cameraCount} min={1} max={512} onChange={(next) => update('cameraCount', next)} />
                <SelectField label="解析度" value={value.resolution} options={RESOLUTION_OPTIONS} onChange={(next) => update('resolution', next)} />
                <SelectField label="壓縮格式" value={value.compression} options={COMPRESSION_OPTIONS} onChange={(next) => update('compression', next)} />
                <SelectField label="錄影張數 (FPS)" value={value.fps} options={FPS_OPTIONS.map((item) => ({ value: item, label: `${item} FPS` }))} onChange={(next) => update('fps', next)} />
                <SelectField
                    label="每天錄影多久"
                    value={value.hoursPerDay}
                    options={HOURS_PER_DAY_OPTIONS.map((item) => ({ value: item, label: `${item} 小時` }))}
                    onChange={(next) => update('hoursPerDay', next)}
                />
                {mode === 'storage' ? (
                    <NumberField label="想保留幾天錄影" value={value.retentionDays} min={1} max={365} suffix="天" onChange={(next) => update('retentionDays', next)} />
                ) : (
                    <NumberField label="你現在有多少硬碟容量" value={value.driveCapacityTb} min={0.5} max={1024} step={0.5} suffix="TB" onChange={(next) => update('driveCapacityTb', next)} />
                )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                <button type="button" onClick={() => setIsAdvancedOpen((current) => !current)} className="flex w-full items-center justify-between gap-4 text-left">
                    <div>
                        <h3 className="text-lg font-black text-slate-950">進階估算</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">預設使用推薦碼流。若你已經知道實際主碼流，再展開這裡調整就好。</p>
                    </div>
                    <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                        {isAdvancedOpen ? '收起' : '展開'}
                    </span>
                </button>

                {isAdvancedOpen ? (
                    <div className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <SelectField
                                label="錄影方式"
                                value={value.recordingMode}
                                options={RECORDING_MODE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                onChange={(next) => update('recordingMode', next)}
                            />
                            <SelectField
                                label="現場活動量"
                                value={value.activityLevel}
                                options={ACTIVITY_OPTIONS.map((item) => ({ value: item.value, label: `${item.label}活動量` }))}
                                onChange={(next) => update('activityLevel', next)}
                            />
                            <NumberField
                                label="安全餘量"
                                value={Math.round(value.safetyMargin * 100)}
                                min={0}
                                max={50}
                                suffix="%"
                                onChange={(next) => update('safetyMargin', next / 100)}
                            />
                        </div>

                        <div className="mt-6">
                            <div className="mb-3 text-sm font-bold text-slate-800">碼流模式</div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => update('bitrateMode', 'recommended')}
                                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${value.bitrateMode === 'recommended' ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900'}`}
                                >
                                    使用推薦碼流
                                </button>
                                <button
                                    type="button"
                                    onClick={() => update('bitrateMode', 'manual')}
                                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${value.bitrateMode === 'manual' ? 'bg-[#1d4ed8] text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900'}`}
                                >
                                    手動輸入碼流
                                </button>
                            </div>
                        </div>

                        {value.bitrateMode === 'manual' ? (
                            <div className="mt-6 max-w-sm">
                                <NumberField
                                    label="手動輸入主碼流"
                                    value={value.manualBitrateMbps}
                                    min={0.1}
                                    max={200}
                                    step={0.1}
                                    suffix="Mbps"
                                    onChange={(next) => update('manualBitrateMbps', next)}
                                />
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
