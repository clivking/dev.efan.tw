'use client';

import { QuoteRequestData, CCTVDetails } from '../lib/quote-request-types';
import NumberStepper from './NumberStepper';

const STORAGE_DAYS = ['7天', '14天', '30天', '60天', '90天'];
const ORIGINS = ['不拘', '台灣製造', '國防部採購'];
const FEATURES_BASIC = ['夜視功能', '手機遠端觀看', '雲端儲存'];
const FEATURES_AI = ['AI人形偵測', 'AI入侵警告', 'AI車牌辨識', 'AI人臉辨識', 'AI火災偵測'];

const RESOLUTIONS = [
    {
        id: '200萬畫素（1080P）',
        name: '200萬畫素（1080P）',
        badge: '⭐ 推薦',
        desc: '基本高清，適合一般店面與辦公室',
        price: '💰',
        priceLabel: '經濟',
    },
    {
        id: '400萬畫素（2K）',
        name: '400萬畫素（2K）',
        badge: '',
        desc: '超高清，人臉車牌清晰可辨',
        price: '💰💰',
        priceLabel: '中等',
    },
    {
        id: '800萬畫素（4K）',
        name: '800萬畫素（4K）',
        badge: '',
        desc: '頂級畫質，大範圍場景首選',
        price: '💰💰💰',
        priceLabel: '較高',
    },
];

export default function StepCCTV({
    data, onChange,
}: { data: QuoteRequestData; onChange: (d: Partial<QuoteRequestData>) => void }) {
    const c = data.details.cctv || { cameraCount: 4, storageDays: [], resolution: [], origin: [], extras: [] };

    const update = (patch: Partial<CCTVDetails>) => {
        onChange({ details: { ...data.details, cctv: { ...c, ...patch } } });
    };

    const toggleArr = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    // Ensure arrays
    const resArr = Array.isArray(c.resolution) ? c.resolution : (c.resolution ? [c.resolution] : []);
    const oriArr = Array.isArray(c.origin) ? c.origin : (c.origin ? [c.origin] : []);
    const storArr = Array.isArray(c.storageDays) ? c.storageDays : (c.storageDays ? [c.storageDays] : []);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-2">📹 監視錄影需求</h2>
                <p className="text-gray-500 mb-6">請告訴我們監視系統的基本需求</p>
            </div>

            {/* ── 基本需求 ── */}
            <div className="space-y-6">
                <NumberStepper
                    label="攝影機數量"
                    value={c.cameraCount}
                    onChange={v => update({ cameraCount: v })}
                    min={1} max={200} step={1}
                    unit="台"
                />

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">儲存天數（可複選，方便比較方案）</label>
                    <div className="flex flex-wrap gap-2">
                        {STORAGE_DAYS.map(d => (
                            <button key={d} type="button" onClick={() => update({ storageDays: toggleArr(storArr, d) as any })}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                    storArr.includes(d)
                                        ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}>
                                {storArr.includes(d) ? '✓ ' : ''}{d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 分隔線 ── */}
            <div className="border-t border-gray-200" />

            {/* ── 畫質 = 方案等級 ── */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">畫質需求</h3>
                <p className="text-sm text-gray-500 mb-4">畫質是影響價格的主要因素，可多選比較方案</p>
                <div className="grid gap-3">
                    {RESOLUTIONS.map(r => {
                        const active = resArr.includes(r.id);
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => update({ resolution: toggleArr(resArr, r.id) as any })}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                                    active
                                        ? 'border-efan-accent bg-efan-accent/5 shadow-md shadow-efan-accent/10'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-base">{r.name}</span>
                                        {r.badge && (
                                            <span className="px-2 py-0.5 rounded-full bg-efan-accent/10 text-efan-accent text-xs font-bold">
                                                {r.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-0.5">{r.desc}</div>
                                    <div className="text-sm mt-1">
                                        <span className="text-efan-accent font-bold">{r.price} {r.priceLabel}</span>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
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

            {/* ── 分隔線 ── */}
            <div className="border-t border-gray-200" />

            {/* ── 偏好 & 功能 ── */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">產地偏好（可複選）</label>
                    <div className="flex flex-wrap gap-2">
                        {ORIGINS.map(o => (
                            <button key={o} type="button" onClick={() => update({ origin: toggleArr(oriArr, o) as any })}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                    oriArr.includes(o)
                                        ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}>
                                {oriArr.includes(o) ? '✓ ' : ''}{o}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">基本功能（可複選）</label>
                    <div className="flex flex-wrap gap-2">
                        {FEATURES_BASIC.map(f => (
                            <button key={f} type="button" onClick={() => update({ extras: toggleArr(c.extras, f) })}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                    c.extras.includes(f)
                                        ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}>
                                {c.extras.includes(f) ? '✓ ' : ''}{f}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">AI 智慧功能（可複選）</label>
                    <div className="flex flex-wrap gap-2">
                        {FEATURES_AI.map(f => (
                            <button key={f} type="button" onClick={() => update({ extras: toggleArr(c.extras, f) })}
                                className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                    c.extras.includes(f)
                                        ? 'border-purple-500 bg-purple-50 font-bold text-purple-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}>
                                {c.extras.includes(f) ? '✓ ' : ''}{f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
