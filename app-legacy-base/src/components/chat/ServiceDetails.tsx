'use client';

import { useState } from 'react';
import { SERVICE_LABELS } from '@/lib/types/consultation-types';
import type {
    ServiceType,
    AccessControlDetails,
    CCTVDetails,
    PhoneSystemDetails,
    AttendanceDetails,
    NetworkDetails,
} from '@/lib/types/consultation-types';
import StepperInput from './StepperInput';

// ─── Option definitions (aligned with /quote-request) ────────────

const AC_DOOR_TYPES = ['一般門', '玻璃門', '自動門', '鐵捲門', '柵欄機'];
const AC_EXTRAS = ['人員進出紀錄', '薪資考勤', '門口對講機', '遙控器開門', '手機APP開門'];
const AC_PLANS = [
    { id: 'basic', name: '經濟型', desc: '基本感應＋密碼開門功能、高CP值', icon: '💡' },
    { id: 'standard', name: '標準型', desc: '無螢幕，主流門禁品牌、穩定耐用', icon: '⭐' },
    { id: 'advanced', name: '進階型', desc: '有螢幕，內建電腦連線、企業首選', icon: '🏢' },
    { id: 'ai_fingerprint', name: 'AI智慧型 — 指紋辨識', desc: '指紋辨識開門、安全性高', icon: '🔐' },
    { id: 'ai_face', name: 'AI智慧型 — 人臉辨識', desc: '人臉辨識免接觸、最先進', icon: '🤖' },
];

const CCTV_STORAGE_DAYS = ['7天', '14天', '30天', '60天', '90天'];
const CCTV_ORIGINS = ['不拘', '台灣製造', '國防部採購'];
const CCTV_FEATURES_BASIC = ['夜視功能', '手機遠端觀看', '雲端儲存'];
const CCTV_FEATURES_AI = ['AI人形偵測', 'AI入侵警告', 'AI車牌辨識', 'AI人臉辨識', 'AI火災偵測'];
const CCTV_RESOLUTIONS = [
    { id: '200萬畫素（1080P）', name: '200萬（1080P）', badge: '⭐ 推薦', price: '💰', priceLabel: '經濟' },
    { id: '400萬畫素（2K）', name: '400萬（2K）', badge: '', price: '💰💰', priceLabel: '中等' },
    { id: '800萬畫素（4K）', name: '800萬（4K）', badge: '', price: '💰💰💰', priceLabel: '較高' },
];

const PHONE_EXTRAS = ['號碼來電顯示', '自動語音總機', '通話錄音', '手機APP分機'];

const ATTENDANCE_METHODS = ['感應卡片', '指紋辨識', '人臉辨識', '手機打卡'];
const ATTENDANCE_FEATURES = ['出勤紀錄', '計算薪資', '人事管理'];

const NETWORK_REQUIREMENTS = [
    '機櫃規劃建置', 'Wi-Fi 無線覆蓋', '路由器 / 交換器安裝',
    '網路不穩改善', '新裝潢預埋網路線', '網路佈線', '弱電箱整理',
];

// ─── Types ──────────────────────────────────────────────────────

type ServiceDetailsMap = {
    access_control?: AccessControlDetails;
    cctv?: CCTVDetails;
    phone_system?: PhoneSystemDetails;
    attendance?: AttendanceDetails;
    network?: NetworkDetails;
};

interface ServiceDetailsProps {
    service: ServiceType;
    details: ServiceDetailsMap;
    onChange: (details: ServiceDetailsMap) => void;
    onPrev: () => void;
    onNext: () => void;
    stepLabel?: string; // e.g. "服務 1/2"
}

// ─── Helpers ────────────────────────────────────────────────────

const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

function PillToggle({
    options,
    selected,
    onChange,
}: {
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
}) {
    return (
        <div className="pill-toggle-grid">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(toggleArr(selected, opt))}
                    className={`pill-toggle ${selected.includes(opt) ? 'checked' : ''}`}
                >
                    {selected.includes(opt) ? '✓ ' : ''}{opt}
                </button>
            ))}
        </div>
    );
}

function PlanCard({
    plans,
    selected,
    onToggle,
}: {
    plans: { id: string; name: string; desc: string; icon: string }[];
    selected: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div className="plan-card-list">
            {plans.map(p => {
                const active = selected.includes(p.id);
                return (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onToggle(p.id)}
                        className={`plan-card ${active ? 'checked' : ''}`}
                    >
                        <span className="plan-card-icon">{p.icon}</span>
                        <div className="plan-card-text">
                            <span className="plan-card-name">{p.name}</span>
                            <span className="plan-card-desc">{p.desc}</span>
                        </div>
                        <div className={`plan-card-check ${active ? 'checked' : ''}`}>
                            {active && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────

export default function ServiceDetails({
    service,
    details,
    onChange,
    onPrev,
    onNext,
    stepLabel,
}: ServiceDetailsProps) {
    const label = SERVICE_LABELS[service];
    const getDetail = (svc: ServiceType) => (details as any)[svc] || {};
    const updateDetail = (svc: ServiceType, data: any) => {
        onChange({ ...details, [svc]: data });
    };

    const renderForm = () => {
        switch (service) {
            case 'access_control':
                return <AccessControlForm detail={getDetail('access_control')} onChange={d => updateDetail('access_control', d)} />;
            case 'cctv':
                return <CCTVForm detail={getDetail('cctv')} onChange={d => updateDetail('cctv', d)} />;
            case 'phone_system':
                return <PhoneSystemForm detail={getDetail('phone_system')} onChange={d => updateDetail('phone_system', d)} />;
            case 'attendance':
                return <AttendanceForm detail={getDetail('attendance')} onChange={d => updateDetail('attendance', d)} />;
            case 'network':
                return <NetworkForm detail={getDetail('network')} onChange={d => updateDetail('network', d)} />;
            default:
                return null;
        }
    };

    return (
        <div className="consultation-step">
            <div className="service-detail-header">
                <span className="service-detail-icon">{label?.icon}</span>
                <span className="service-detail-title">{label?.name}需求</span>
                {stepLabel && (
                    <span className="service-detail-counter">{stepLabel}</span>
                )}
            </div>

            {renderForm()}

            <div className="consultation-actions consultation-actions-between">
                <button type="button" className="consultation-btn consultation-btn-secondary" onClick={onPrev}>
                    ← 上一步
                </button>
                <button type="button" className="consultation-btn consultation-btn-primary" onClick={onNext}>
                    下一步 →
                </button>
            </div>
        </div>
    );
}

// ─── Sub-forms ──────────────────────────────────────────────────

function AccessControlForm({ detail, onChange }: { detail: any; onChange: (d: AccessControlDetails) => void }) {
    const d: AccessControlDetails = { doorCount: 1, doorTypes: [], extras: [], plans: [], ...detail };
    return (
        <div className="service-detail-form">
            <StepperInput
                value={d.doorCount || 1}
                onChange={v => onChange({ ...d, doorCount: v })}
                min={1} max={100}
                label="門禁數量"
                unit="門"
                hint="💡 一般辦公室 1-4 門，整棟大樓建議 8 門以上"
            />

            <div className="detail-section">
                <p className="detail-section-label">門的類型（可多選）</p>
                <PillToggle options={AC_DOOR_TYPES} selected={d.doorTypes} onChange={doorTypes => onChange({ ...d, doorTypes })} />
            </div>

            <div className="detail-section">
                <p className="detail-section-label">附加功能（可多選）</p>
                <PillToggle options={AC_EXTRAS} selected={d.extras} onChange={extras => onChange({ ...d, extras })} />
            </div>

            <div className="detail-divider" />

            <div className="detail-section">
                <p className="detail-section-label-lg">想了解哪些方案？</p>
                <p className="detail-section-hint">可多選，我們會根據您的需求推薦最合適的組合</p>
                <PlanCard plans={AC_PLANS} selected={d.plans} onToggle={id => onChange({ ...d, plans: toggleArr(d.plans, id) })} />
            </div>
        </div>
    );
}

function CCTVForm({ detail, onChange }: { detail: any; onChange: (d: CCTVDetails) => void }) {
    const d: CCTVDetails = { cameraCount: 4, storageDays: [], resolution: [], origin: [], extras: [], ...detail };
    const storArr = Array.isArray(d.storageDays) ? d.storageDays : (d.storageDays ? [d.storageDays] : []);
    const resArr = Array.isArray(d.resolution) ? d.resolution : (d.resolution ? [d.resolution] : []);
    const oriArr = Array.isArray(d.origin) ? d.origin : (d.origin ? [d.origin] : []);

    return (
        <div className="service-detail-form">
            <StepperInput
                value={d.cameraCount || 4}
                onChange={v => onChange({ ...d, cameraCount: v })}
                min={1} max={200}
                label="攝影機數量"
                unit="台"
                hint="💡 一般辦公室約 4-8 支，整棟大樓建議 16 支以上"
            />

            <div className="detail-section">
                <p className="detail-section-label">儲存天數（可複選，方便比較方案）</p>
                <PillToggle options={CCTV_STORAGE_DAYS} selected={storArr} onChange={storageDays => onChange({ ...d, storageDays: storageDays as any })} />
            </div>

            <div className="detail-divider" />

            <div className="detail-section">
                <p className="detail-section-label-lg">畫質需求</p>
                <p className="detail-section-hint">畫質是影響價格的主要因素，可多選比較方案</p>
                <div className="plan-card-list">
                    {CCTV_RESOLUTIONS.map(r => {
                        const active = resArr.includes(r.id);
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => onChange({ ...d, resolution: toggleArr(resArr, r.id) as any })}
                                className={`plan-card ${active ? 'checked' : ''}`}
                            >
                                <div className="plan-card-text">
                                    <span className="plan-card-name">
                                        {r.name}
                                        {r.badge && <span className="plan-card-badge">{r.badge}</span>}
                                    </span>
                                    <span className="plan-card-price">{r.price} {r.priceLabel}</span>
                                </div>
                                <div className={`plan-card-check ${active ? 'checked' : ''}`}>
                                    {active && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="detail-divider" />

            <div className="detail-section">
                <p className="detail-section-label">產地偏好（可複選）</p>
                <PillToggle options={CCTV_ORIGINS} selected={oriArr} onChange={origin => onChange({ ...d, origin: origin as any })} />
            </div>

            <div className="detail-section">
                <p className="detail-section-label">基本功能（可複選）</p>
                <PillToggle options={CCTV_FEATURES_BASIC} selected={d.extras} onChange={extras => onChange({ ...d, extras })} />
            </div>

            <div className="detail-section">
                <p className="detail-section-label">AI 智慧功能（可複選）</p>
                <PillToggle options={CCTV_FEATURES_AI} selected={d.extras} onChange={extras => onChange({ ...d, extras })} />
            </div>
        </div>
    );
}

function PhoneSystemForm({ detail, onChange }: { detail: any; onChange: (d: PhoneSystemDetails) => void }) {
    const d: PhoneSystemDetails = { externalLines: 3, extensions: 8, extras: [], ...detail };
    return (
        <div className="service-detail-form">
            <StepperInput
                value={d.externalLines || 3}
                onChange={v => onChange({ ...d, externalLines: v })}
                min={1} max={100}
                label="外線數量"
                unit="線"
            />
            <StepperInput
                value={d.extensions || 8}
                onChange={v => onChange({ ...d, extensions: v })}
                min={1} max={500}
                label="分機數量"
                unit="台"
                hint="💡 10人公司通常 3 外線 + 10 分機"
            />

            <div className="detail-divider" />

            <div className="detail-section">
                <p className="detail-section-label">功能需求（可複選）</p>
                <PillToggle options={PHONE_EXTRAS} selected={d.extras} onChange={extras => onChange({ ...d, extras })} />
            </div>
        </div>
    );
}

function AttendanceForm({ detail, onChange }: { detail: any; onChange: (d: AttendanceDetails) => void }) {
    const d: AttendanceDetails = { employeeCount: 3, methods: [], extras: [], ...detail };
    return (
        <div className="service-detail-form">
            <StepperInput
                value={d.employeeCount || 3}
                onChange={v => onChange({ ...d, employeeCount: v })}
                min={1} max={9999}
                label="員工人數"
                unit="人"
            />

            <div className="detail-section">
                <p className="detail-section-label">打卡方式（可複選）</p>
                <PillToggle options={ATTENDANCE_METHODS} selected={d.methods} onChange={methods => onChange({ ...d, methods })} />
            </div>

            <div className="detail-divider" />

            <div className="detail-section">
                <p className="detail-section-label">功能需求（可複選）</p>
                <PillToggle options={ATTENDANCE_FEATURES} selected={d.extras} onChange={extras => onChange({ ...d, extras })} />
            </div>
        </div>
    );
}

function NetworkForm({ detail, onChange }: { detail: any; onChange: (d: NetworkDetails) => void }) {
    const d: NetworkDetails = { area: 50, rooms: 6, users: 10, withElectrician: null, extras: [], ...detail };
    return (
        <div className="service-detail-form">
            <StepperInput
                value={d.area || 50}
                onChange={v => onChange({ ...d, area: v })}
                min={1} max={9999} step={5}
                label="空間坪數"
                unit="坪"
            />
            <StepperInput
                value={d.rooms || 6}
                onChange={v => onChange({ ...d, rooms: v })}
                min={0} max={200}
                label="隔間數量"
                unit="間"
            />
            <StepperInput
                value={d.users || 10}
                onChange={v => onChange({ ...d, users: v })}
                min={1} max={9999}
                label="使用人數"
                unit="人"
            />

            <div className="detail-section">
                <p className="detail-section-label">配合水電</p>
                <div className="pill-toggle-grid">
                    {[
                        { val: true, label: '是' },
                        { val: false, label: '否' },
                    ].map(opt => (
                        <button
                            key={String(opt.val)}
                            type="button"
                            onClick={() => onChange({ ...d, withElectrician: opt.val })}
                            className={`pill-toggle ${d.withElectrician === opt.val ? 'checked' : ''}`}
                        >
                            {d.withElectrician === opt.val ? '✓ ' : ''}{opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="detail-divider" />

            <div className="detail-section">
                <p className="detail-section-label">需求內容（可複選）</p>
                <PillToggle options={NETWORK_REQUIREMENTS} selected={d.extras} onChange={extras => onChange({ ...d, extras })} />
            </div>
        </div>
    );
}
