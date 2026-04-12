'use client';

import { QuoteRequestData, AccessControlDetails } from '../lib/quote-request-types';
import NumberStepper from './NumberStepper';

const DOOR_TYPES = ['一般門', '玻璃門', '自動門', '鐵捲門', '柵欄機'];
const EXTRAS = ['人員進出紀錄', '薪資考勤', '門口對講機', '遙控器開門', '手機APP開門'];

const PLANS = [
    { id: 'basic', name: '經濟型', desc: '基本感應＋密碼開門功能、高CP值', icon: '💡' },
    { id: 'standard', name: '標準型', desc: '無螢幕，主流門禁品牌、穩定耐用', icon: '⭐' },
    { id: 'advanced', name: '進階型', desc: '有螢幕，內建電腦連線、企業首選', icon: '🏢' },
    { id: 'ai_fingerprint', name: 'AI智慧型 — 指紋生物辨識', desc: '指紋辨識開門、安全性高', icon: '🔐' },
    { id: 'ai_face', name: 'AI智慧型 — 人臉AI辨識', desc: '人臉辨識免接觸、最先進', icon: '🤖' },
];

export default function StepAccessControl({
    data, onChange,
}: { data: QuoteRequestData; onChange: (d: Partial<QuoteRequestData>) => void }) {
    const ac = data.details.accessControl || { doorCount: 1, doorTypes: [], extras: [], plans: [] };

    const update = (patch: Partial<AccessControlDetails>) => {
        onChange({ details: { ...data.details, accessControl: { ...ac, ...patch } } });
    };

    const toggleArr = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-2">🚪 門禁系統需求</h2>
                <p className="text-gray-500 mb-6">請告訴我們門禁的基本需求</p>
            </div>

            {/* ── 基本需求 ── */}
            <div className="space-y-6">
                <NumberStepper
                    label="門禁數量"
                    value={ac.doorCount}
                    onChange={v => update({ doorCount: v })}
                    min={1} max={100} step={1}
                    unit="門"
                />

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">門的類型（可多選）</label>
                    <div className="flex flex-wrap gap-2">
                        {DOOR_TYPES.map(t => (
                            <button key={t} type="button" onClick={() => update({ doorTypes: toggleArr(ac.doorTypes, t) })}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                    ac.doorTypes.includes(t)
                                        ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}>
                                {ac.doorTypes.includes(t) ? '✓ ' : ''}{t}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">附加功能（可多選）</label>
                    <div className="flex flex-wrap gap-2">
                        {EXTRAS.map(e => (
                            <button key={e} type="button" onClick={() => update({ extras: toggleArr(ac.extras, e) })}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                    ac.extras.includes(e)
                                        ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}>
                                {ac.extras.includes(e) ? '✓ ' : ''}{e}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 分隔線 ── */}
            <div className="border-t border-gray-200" />

            {/* ── 方案選擇 ── */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">想了解哪些方案？</h3>
                <p className="text-sm text-gray-500 mb-4">可多選，我們會根據您的需求推薦最合適的組合</p>
                <div className="grid gap-3">
                    {PLANS.map(p => {
                        const active = ac.plans.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => update({ plans: toggleArr(ac.plans, p.id) })}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                                    active
                                        ? 'border-efan-accent bg-efan-accent/5 shadow-md shadow-efan-accent/10'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-2xl">{p.icon}</span>
                                <div className="flex-1">
                                    <div className="font-bold text-base">{p.name}</div>
                                    <div className="text-sm text-gray-500">{p.desc}</div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    active ? 'bg-efan-accent border-efan-accent' : 'border-gray-300'
                                }`}>
                                    {active && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
