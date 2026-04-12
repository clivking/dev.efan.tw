'use client';

import { QuoteRequestData, NetworkDetails } from '../lib/quote-request-types';
import NumberStepper from './NumberStepper';

const REQUIREMENTS = [
    '機櫃規劃建置', 'Wi-Fi 無線覆蓋', '路由器 / 交換器安裝',
    '網路不穩改善', '新裝潢預埋網路線', '網路佈線', '弱電箱整理',
];

export default function StepNetwork({
    data, onChange,
}: { data: QuoteRequestData; onChange: (d: Partial<QuoteRequestData>) => void }) {
    const n = data.details.network || { area: 50, rooms: 6, users: 10, withElectrician: null, extras: [] };

    const update = (patch: Partial<NetworkDetails>) => {
        onChange({ details: { ...data.details, network: { ...n, ...patch } } });
    };

    const toggleArr = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-2">🌐 網路工程需求</h2>
                <p className="text-gray-500 mb-6">請告訴我們場地與網路的基本需求</p>
            </div>

            {/* ── 場地資訊 ── */}
            <div className="space-y-6">
                <NumberStepper
                    label="空間坪數"
                    value={n.area}
                    onChange={v => update({ area: v })}
                    min={1} max={9999} step={5}
                    unit="坪"
                />

                <NumberStepper
                    label="隔間數量"
                    value={n.rooms}
                    onChange={v => update({ rooms: v })}
                    min={0} max={200} step={1}
                    unit="間"
                />

                <NumberStepper
                    label="使用人數"
                    value={n.users}
                    onChange={v => update({ users: v })}
                    min={1} max={9999} step={1}
                    unit="人"
                />

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">配合水電</label>
                    <div className="flex gap-3">
                        {[
                            { val: true, label: '是' },
                            { val: false, label: '否' },
                        ].map(opt => (
                            <button
                                key={String(opt.val)}
                                type="button"
                                onClick={() => update({ withElectrician: opt.val })}
                                className={`px-6 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                                    n.withElectrician === opt.val
                                        ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            >
                                {n.withElectrician === opt.val ? '✓ ' : ''}{opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* ── 需求內容 ── */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">需求內容（可複選）</label>
                <div className="flex flex-wrap gap-2">
                    {REQUIREMENTS.map(r => (
                        <button key={r} type="button" onClick={() => update({ extras: toggleArr(n.extras, r) })}
                            className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                n.extras.includes(r)
                                    ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}>
                            {n.extras.includes(r) ? '✓ ' : ''}{r}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
