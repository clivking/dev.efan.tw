'use client';

import { QuoteRequestData, ServiceType, SERVICE_LABELS } from '../lib/quote-request-types';

const SERVICES: ServiceType[] = ['access_control', 'cctv', 'phone_system', 'attendance', 'network', 'other'];

/** Color tints for each service card */
const SERVICE_COLORS: Record<ServiceType, { bg: string; ring: string; iconBg: string }> = {
    access_control: { bg: 'bg-blue-50/60', ring: 'ring-blue-400', iconBg: 'from-blue-100 to-blue-200' },
    cctv: { bg: 'bg-purple-50/60', ring: 'ring-purple-400', iconBg: 'from-purple-100 to-purple-200' },
    phone_system: { bg: 'bg-emerald-50/60', ring: 'ring-emerald-400', iconBg: 'from-emerald-100 to-emerald-200' },
    attendance: { bg: 'bg-amber-50/60', ring: 'ring-amber-400', iconBg: 'from-amber-100 to-amber-200' },
    network: { bg: 'bg-cyan-50/60', ring: 'ring-cyan-400', iconBg: 'from-cyan-100 to-cyan-200' },
    other: { bg: 'bg-gray-50/60', ring: 'ring-gray-400', iconBg: 'from-gray-100 to-gray-200' },
};

export default function StepServices({
    data, onChange,
}: { data: QuoteRequestData; onChange: (d: Partial<QuoteRequestData>) => void }) {
    const toggle = (s: ServiceType) => {
        const next = data.services.includes(s)
            ? data.services.filter(x => x !== s)
            : [...data.services, s];
        onChange({ services: next });
    };

    const hasOther = data.services.includes('other');

    return (
        <div>
            <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-2">您需要什麼服務？</h2>
            <p className="text-gray-500 mb-8">可多選，我們將針對您選擇的服務提供專業報價</p>

            {/* All 6 services — 2-column grid, 其他 next to 網路工程 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map(s => {
                    const label = SERVICE_LABELS[s];
                    const colors = SERVICE_COLORS[s];
                    const active = data.services.includes(s);
                    return (
                        <button
                            key={s}
                            type="button"
                            onClick={() => toggle(s)}
                            className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200
                                ${active
                                    ? `${colors.bg} border-efan-primary/60 ring-2 ${colors.ring}/30 shadow-md`
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.iconBg}
                                flex items-center justify-center text-2xl transition-transform duration-200
                                ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                                {label.icon}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-base text-gray-800">{label.name}</div>
                                <div className="text-xs text-gray-500 truncate">{label.desc}</div>
                            </div>

                            {/* Checkbox */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                transition-all duration-200
                                ${active ? 'bg-efan-primary border-efan-primary scale-110' : 'border-gray-300 group-hover:border-gray-400'}`}>
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

            {/* "Other" text input — slides open */}
            {hasOther && (
                <div className="mt-3 animate-fade-in">
                    <textarea
                        value={data.otherDescription}
                        onChange={e => onChange({ otherDescription: e.target.value })}
                        rows={3}
                        placeholder="請簡述您的需求，例如：舊系統維修、辦公室搬遷佈線..."
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-efan-primary focus:outline-none
                                   text-base resize-none transition-colors"
                    />
                </div>
            )}
        </div>
    );
}
