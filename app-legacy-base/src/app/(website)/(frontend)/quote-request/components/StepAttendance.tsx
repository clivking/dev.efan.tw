'use client';

import { QuoteRequestData, AttendanceDetails } from '../lib/quote-request-types';
import NumberStepper from './NumberStepper';

const METHODS = ['感應卡片', '指紋辨識', '人臉辨識', '手機打卡'];
const FEATURES = ['出勤紀錄', '計算薪資', '人事管理'];

export default function StepAttendance({
    data, onChange,
}: { data: QuoteRequestData; onChange: (d: Partial<QuoteRequestData>) => void }) {
    const a = data.details.attendance || { employeeCount: 3, methods: [], extras: [] };

    const update = (patch: Partial<AttendanceDetails>) => {
        onChange({ details: { ...data.details, attendance: { ...a, ...patch } } });
    };

    const toggleArr = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-2">⏰ 考勤系統需求</h2>
                <p className="text-gray-500 mb-6">請告訴我們考勤系統的基本需求</p>
            </div>

            <div className="space-y-6">
                <NumberStepper
                    label="員工人數"
                    value={a.employeeCount}
                    onChange={v => update({ employeeCount: v })}
                    min={1} max={9999} step={1}
                    unit="人"
                />

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">打卡方式（可複選）</label>
                    <div className="flex flex-wrap gap-2">
                        {METHODS.map(m => (
                            <button key={m} type="button" onClick={() => update({ methods: toggleArr(a.methods, m) })}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                    a.methods.includes(m)
                                        ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}>
                                {a.methods.includes(m) ? '✓ ' : ''}{m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200" />

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">功能需求（可複選）</label>
                <div className="flex flex-wrap gap-2">
                    {FEATURES.map(f => (
                        <button key={f} type="button" onClick={() => update({ extras: toggleArr(a.extras, f) })}
                            className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                a.extras.includes(f)
                                    ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}>
                            {a.extras.includes(f) ? '✓ ' : ''}{f}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
