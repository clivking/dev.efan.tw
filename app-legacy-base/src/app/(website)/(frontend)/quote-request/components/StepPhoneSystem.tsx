'use client';

import { QuoteRequestData, PhoneSystemDetails } from '../lib/quote-request-types';
import NumberStepper from './NumberStepper';

const EXTRAS = ['號碼來電顯示', '自動語音總機', '通話錄音', '手機APP分機'];

export default function StepPhoneSystem({
    data, onChange,
}: { data: QuoteRequestData; onChange: (d: Partial<QuoteRequestData>) => void }) {
    const p = data.details.phoneSystem || { externalLines: 3, extensions: 8, extras: [] };

    const update = (patch: Partial<PhoneSystemDetails>) => {
        onChange({ details: { ...data.details, phoneSystem: { ...p, ...patch } } });
    };

    const toggleArr = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-2">📞 電話總機需求</h2>
                <p className="text-gray-500 mb-6">請告訴我們電話系統的基本需求</p>
            </div>

            <div className="space-y-6">
                <NumberStepper
                    label="外線數量"
                    value={p.externalLines}
                    onChange={v => update({ externalLines: v })}
                    min={1} max={100} step={1}
                    unit="線"
                />

                <NumberStepper
                    label="分機數量"
                    value={p.extensions}
                    onChange={v => update({ extensions: v })}
                    min={1} max={500} step={1}
                    unit="台"
                />
            </div>

            <div className="border-t border-gray-200" />

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">功能需求（可複選）</label>
                <div className="flex flex-wrap gap-2">
                    {EXTRAS.map(e => (
                        <button key={e} type="button" onClick={() => update({ extras: toggleArr(p.extras, e) })}
                            className={`px-4 py-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                                p.extras.includes(e)
                                    ? 'border-efan-primary bg-efan-primary/5 font-bold text-efan-primary'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}>
                            {p.extras.includes(e) ? '✓ ' : ''}{e}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
