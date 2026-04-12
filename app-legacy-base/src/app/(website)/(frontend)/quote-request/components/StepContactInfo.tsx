'use client';

import { useEffect, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { QuoteRequestData, SERVICE_LABELS } from '../lib/quote-request-types';

export default function StepContactInfo({
    data, onChange, errors,
    onTurnstileToken, honeypotValue, onHoneypotChange,
}: {
    data: QuoteRequestData;
    onChange: (d: Partial<QuoteRequestData>) => void;
    errors: Record<string, string>;
    onTurnstileToken?: (token: string) => void;
    honeypotValue?: string;
    onHoneypotChange?: (val: string) => void;
}) {
    const [siteConfig, setSiteConfig] = useState<{ turnstileEnabled: boolean; turnstileSiteKey: string | null }>({
        turnstileEnabled: false,
        turnstileSiteKey: null,
    });

    useEffect(() => {
        fetch('/api/public/site-config')
            .then(r => r.json())
            .then(setSiteConfig)
            .catch(() => {});
    }, []);

    // Build a simple summary of selected services
    const summaryItems: string[] = [];
    for (const s of data.services) {
        if (s === 'other') {
            summaryItems.push(`📝 其他需求`);
        } else {
            const label = SERVICE_LABELS[s];
            let detail = label.name;
            if (s === 'access_control' && data.details.accessControl) {
                detail += `（${data.details.accessControl.doorCount}門）`;
            }
            if (s === 'cctv' && data.details.cctv) {
                detail += `（${data.details.cctv.cameraCount}台）`;
            }
            if (s === 'phone_system' && data.details.phoneSystem) {
                detail += `（外${data.details.phoneSystem.externalLines}內${data.details.phoneSystem.extensions}）`;
            }
            if (s === 'attendance' && data.details.attendance) {
                detail += `（${data.details.attendance.employeeCount}人）`;
            }
            if (s === 'network' && data.details.network) {
                detail += `（${data.details.network.area}坪）`;
            }
            summaryItems.push(`${label.icon} ${detail}`);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-2">請留下您的聯絡資訊</h2>
                <p className="text-gray-500 mb-6">我們會盡快與您聯繫，提供專業報價</p>
            </div>

            {/* ── 需求摘要 ── */}
            {summaryItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-efan-primary/5 border border-efan-primary/10">
                    <div className="text-sm font-bold text-efan-primary mb-2">📋 您的需求摘要</div>
                    <div className="flex flex-wrap gap-2">
                        {summaryItems.map((item, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-white text-sm text-gray-700 shadow-sm border border-gray-100">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 表單欄位 ── */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">公司名稱 <span className="text-gray-400 font-normal">（選填）</span></label>
                    <input type="text" value={data.companyName} onChange={e => onChange({ companyName: e.target.value })}
                        placeholder="例如：ABC 科技有限公司"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-efan-primary focus:outline-none text-base" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">聯絡人 <span className="text-red-500">*</span></label>
                    <input type="text" value={data.contactName} onChange={e => onChange({ contactName: e.target.value })}
                        placeholder="例如：王小姐"
                        className={`w-full p-3 border-2 rounded-xl focus:outline-none text-base ${
                            errors.contactName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-efan-primary'
                        }`} />
                    {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">電話／手機 <span className="text-red-500">*</span></label>
                    <input type="tel" value={data.phone} onChange={e => onChange({ phone: e.target.value })}
                        placeholder="0912-345-678 或 02-7730-1158"
                        className={`w-full p-3 border-2 rounded-xl focus:outline-none text-base ${
                            errors.phone ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-efan-primary'
                        }`} />
                    {/* Instant phone type detection */}
                    {data.phone.replace(/[-\s]/g, '').length >= 4 && (
                        <p className="text-xs mt-1 text-gray-500">
                            {/^09/.test(data.phone.replace(/[-\s]/g, '')) ? '📱 偵測為手機號碼' : '📞 偵測為市話號碼'}
                        </p>
                    )}
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={data.email} onChange={e => onChange({ email: e.target.value })}
                        placeholder="example@company.com"
                        className={`w-full p-3 border-2 rounded-xl focus:outline-none text-base ${
                            errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-efan-primary'
                        }`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">安裝地址 <span className="text-red-500">*</span></label>
                    <input type="text" value={data.address} onChange={e => onChange({ address: e.target.value })}
                        placeholder="例如：台北市松山區南京東路..."
                        className={`w-full p-3 border-2 rounded-xl focus:outline-none text-base ${
                            errors.address ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-efan-primary'
                        }`} />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">補充說明 <span className="text-gray-400 font-normal">（選填）</span></label>
                    <textarea
                        value={data.message}
                        onChange={e => onChange({ message: e.target.value })}
                        rows={3}
                        placeholder="例如：希望下週可以現場勘查，預算約 5 萬以內..."
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-efan-primary focus:outline-none text-base resize-none"
                    />
                </div>
            </div>

            {/* Honeypot — hidden from real users, bots will fill it */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                    type="text"
                    name="website"
                    id="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotValue || ''}
                    onChange={e => onHoneypotChange?.(e.target.value)}
                />
            </div>

            {/* Turnstile widget */}
            {siteConfig.turnstileEnabled && siteConfig.turnstileSiteKey && (
                <div className="mt-2">
                    <Turnstile
                        siteKey={siteConfig.turnstileSiteKey}
                        onSuccess={(token) => onTurnstileToken?.(token)}
                    />
                </div>
            )}

            {/* Response time estimate */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                <span className="text-lg">⏱</span>
                <span className="text-sm text-green-700 font-medium">營業時間內 2 小時回覆報價</span>
            </div>
        </div>
    );
}
