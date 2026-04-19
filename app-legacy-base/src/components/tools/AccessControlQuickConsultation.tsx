'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import StepContactInfo from '@/app/(website)/(frontend)/quote-request/components/StepContactInfo';
import ThankYou from '@/app/(website)/(frontend)/quote-request/components/ThankYou';
import { INITIAL_DATA, type QuoteRequestData } from '@/app/(website)/(frontend)/quote-request/lib/quote-request-types';
import {
    ACCESS_CONTROL_PRODUCT_GUIDES,
    ACCESS_CONTROL_QUICK_CONSULTATION_EXAMPLES,
    ACCESS_CONTROL_QUICK_CONSULTATION_FAQ_ITEMS,
} from '@/lib/access-control-quick-consultation-content';
import {
    ACCESS_METHOD_LABELS,
    ACCESS_SCENARIO_LABELS,
    ACCESS_STAGE_LABELS,
    ACCESS_USER_FLOW_LABELS,
    ACCESS_VISITOR_FLOW_LABELS,
    buildAccessControlConsultationMeta,
    buildAccessControlConsultationNarrative,
    buildAccessControlConsultationRecommendation,
    type AccessControlConsultationAnswers,
    type AccessMethod,
    type AccessProjectStage,
    type AccessScenario,
    type AccessUserFlow,
    type AccessVisitorFlow,
} from '@/lib/access-control-quick-consultation';
import { shouldBypassImageOptimization } from '@/lib/image-paths';

const STORAGE_KEY = 'efan_access_control_quick_consultation_v1';

const DEFAULT_ANSWERS: AccessControlConsultationAnswers = {
    scenario: 'office',
    doorCount: 3,
    users: 'mixed',
    methods: ['card', 'mobile'],
    visitorFlow: 'sometimes',
    remoteManagement: true,
    attendanceIntegration: false,
    projectStage: 'new',
};

function getInitialContactData(): QuoteRequestData {
    return {
        ...INITIAL_DATA,
        services: ['access_control'],
    };
}

function ChoicePill({
    selected,
    label,
    description,
    onClick,
}: {
    selected: boolean;
    label: string;
    description?: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${
                selected
                    ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow-sm'
            }`}
        >
            <div className={`text-base font-black ${selected ? 'text-white' : 'text-slate-950'}`}>{label}</div>
            {description ? (
                <p className={`mt-2 text-sm leading-6 ${selected ? 'text-slate-100' : 'text-slate-500'}`}>{description}</p>
            ) : null}
        </button>
    );
}

function MultiSelectPill({
    selected,
    label,
    onClick,
}: {
    selected: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-4 py-3 text-sm font-bold transition ${
                selected
                    ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950'
            }`}
        >
            {label}
        </button>
    );
}

function NumberField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
            <div className="relative">
                <input
                    type="number"
                    min={1}
                    max={128}
                    step={1}
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-slate-900 shadow-sm outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/10"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">門</span>
            </div>
        </label>
    );
}

function buildContactErrors(data: QuoteRequestData) {
    const errors: Record<string, string> = {};

    if (!data.contactName.trim()) errors.contactName = '請填寫聯絡人姓名';
    if (!data.phone.trim()) {
        errors.phone = '請填寫電話或手機';
    } else {
        const cleanPhone = data.phone.replace(/[-\s]/g, '');
        if (/^09/.test(cleanPhone) && !/^09\d{8}$/.test(cleanPhone)) {
            errors.phone = '手機格式：09 開頭 10 碼';
        }
    }

    if (!data.email.trim()) {
        errors.email = '請填寫 Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = 'Email 格式不正確';
    }

    if (!data.address.trim()) errors.address = '請填寫安裝地址';

    return errors;
}

export default function AccessControlQuickConsultation() {
    const [answers, setAnswers] = useState<AccessControlConsultationAnswers>(DEFAULT_ANSWERS);
    const [contactData, setContactData] = useState<QuoteRequestData>(getInitialContactData);
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [quoteNumber, setQuoteNumber] = useState('');
    const [error, setError] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw) as {
                answers?: AccessControlConsultationAnswers;
                contactData?: QuoteRequestData;
                showContactForm?: boolean;
            };
            if (saved.answers) setAnswers(saved.answers);
            if (saved.contactData) setContactData(saved.contactData);
            if (saved.showContactForm) setShowContactForm(true);
        } catch {
            // Ignore corrupted drafts.
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || submitted) return;
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                answers,
                contactData,
                showContactForm,
            })
        );
    }, [answers, contactData, showContactForm, submitted]);

    const recommendation = buildAccessControlConsultationRecommendation(answers);
    const consultationMeta = buildAccessControlConsultationMeta(answers, recommendation);
    const consultationNarrative = buildAccessControlConsultationNarrative(answers, recommendation);
    const contactFormData: QuoteRequestData = {
        ...contactData,
        services: ['access_control'],
        details: {
            ...contactData.details,
            accessControl: {
                doorCount: answers.doorCount,
                doorTypes: [],
                extras: recommendation.extras,
                plans: recommendation.planPreferences,
                quickConsultation: consultationMeta,
            },
        },
        otherDescription: consultationNarrative,
    };

    function toggleMethod(method: AccessMethod) {
        setAnswers((current) => {
            const hasMethod = current.methods.includes(method);
            const nextMethods = hasMethod
                ? current.methods.filter((item) => item !== method)
                : [...current.methods.filter((item) => item !== 'not_sure'), method];

            if (method === 'not_sure') {
                return {
                    ...current,
                    methods: hasMethod ? [] : ['not_sure'],
                };
            }

            return {
                ...current,
                methods: nextMethods.length > 0 ? nextMethods : ['not_sure'],
            };
        });
    }

    function updateContactPatch(patch: Partial<QuoteRequestData>) {
        setContactData((current) => ({ ...current, ...patch }));
    }

    function revealContactForm() {
        setShowContactForm(true);
        setTimeout(() => {
            document.getElementById('consult-contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    async function handleSubmit() {
        const nextErrors = buildContactErrors(contactFormData);
        setContactErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);
        setError('');

        try {
            const rawPhone = contactFormData.phone.replace(/[-\s]/g, '');
            const isMobile = /^09/.test(rawPhone);

            const payload = {
                services: ['access_control'],
                details: {
                    access_control: contactFormData.details.accessControl,
                },
                budgetTiers: [],
                otherDescription: consultationNarrative,
                companyName: contactFormData.companyName || null,
                contactName: contactFormData.contactName,
                mobile: isMobile ? contactFormData.phone : null,
                phone: isMobile ? null : contactFormData.phone,
                address: contactFormData.address || null,
                email: contactFormData.email || null,
                message: contactFormData.message || null,
                website: honeypot || undefined,
                turnstileToken: turnstileToken || undefined,
            };

            const response = await fetch('/api/public/quote-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await response.json();

            if (!response.ok) {
                setError(json.error || '提交失敗，請稍後再試');
                setSubmitting(false);
                return;
            }

            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(STORAGE_KEY);
            }

            setQuoteNumber(json.quoteNumber || '');
            setSubmitted(true);
        } catch {
            setError('網路錯誤，請稍後再試，或直接來電和我們討論。');
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="bg-[#f5f1e8] px-4 py-12">
                <div className="mx-auto max-w-3xl rounded-[2.25rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
                    <ThankYou quoteNumber={quoteNumber} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f1e8] text-slate-950">
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
                <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="space-y-10">
                        <section id="quick-answer">
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">START</div>
                            <h2 className="mt-2 text-3xl font-black text-slate-950">先判斷方向，再決定要不要送出施工資料</h2>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                                這頁會先把場域、門數、訪客、遠端管理和開門偏好整理成門禁建議。看完結果後，你再決定要不要交給工程師接著細化。
                            </p>
                        </section>

                        <section>
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">1. 場域與規模</div>
                            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {(Object.keys(ACCESS_SCENARIO_LABELS) as AccessScenario[]).map((scenario) => (
                                    <ChoicePill
                                        key={scenario}
                                        selected={answers.scenario === scenario}
                                        label={ACCESS_SCENARIO_LABELS[scenario]}
                                        onClick={() => setAnswers((current) => ({ ...current, scenario }))}
                                    />
                                ))}
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <NumberField
                                    label="大概有幾個出入口"
                                    value={answers.doorCount}
                                    onChange={(doorCount) =>
                                        setAnswers((current) => ({
                                            ...current,
                                            doorCount: Number.isFinite(doorCount) && doorCount > 0 ? doorCount : 1,
                                        }))
                                    }
                                />
                                <div>
                                    <div className="mb-2 text-sm font-bold text-slate-800">主要使用對象</div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {(Object.keys(ACCESS_USER_FLOW_LABELS) as AccessUserFlow[]).map((users) => (
                                            <ChoicePill
                                                key={users}
                                                selected={answers.users === users}
                                                label={ACCESS_USER_FLOW_LABELS[users]}
                                                onClick={() => setAnswers((current) => ({ ...current, users }))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">2. 開門與管理需求</div>
                            <div className="mt-5">
                                <div className="mb-3 text-sm font-bold text-slate-800">希望怎麼開門</div>
                                <div className="flex flex-wrap gap-3">
                                    {(Object.keys(ACCESS_METHOD_LABELS) as AccessMethod[]).map((method) => (
                                        <MultiSelectPill
                                            key={method}
                                            selected={answers.methods.includes(method)}
                                            label={ACCESS_METHOD_LABELS[method]}
                                            onClick={() => toggleMethod(method)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="mb-3 text-sm font-bold text-slate-800">訪客需求</div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {(Object.keys(ACCESS_VISITOR_FLOW_LABELS) as AccessVisitorFlow[]).map((visitorFlow) => (
                                        <ChoicePill
                                            key={visitorFlow}
                                            selected={answers.visitorFlow === visitorFlow}
                                            label={ACCESS_VISITOR_FLOW_LABELS[visitorFlow]}
                                            onClick={() => setAnswers((current) => ({ ...current, visitorFlow }))}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div>
                                    <div className="mb-3 text-sm font-bold text-slate-800">要不要遠端管理</div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <ChoicePill
                                            selected={answers.remoteManagement}
                                            label="需要"
                                            description="想保留遠端開門、權限調整或跨點管理。"
                                            onClick={() => setAnswers((current) => ({ ...current, remoteManagement: true }))}
                                        />
                                        <ChoicePill
                                            selected={!answers.remoteManagement}
                                            label="暫時不用"
                                            description="先以現場管理和基本開門為主。"
                                            onClick={() => setAnswers((current) => ({ ...current, remoteManagement: false }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-3 text-sm font-bold text-slate-800">是否要保留考勤整合</div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <ChoicePill
                                            selected={answers.attendanceIntegration}
                                            label="希望保留"
                                            description="未來可能要串考勤或出勤紀錄。"
                                            onClick={() =>
                                                setAnswers((current) => ({ ...current, attendanceIntegration: true }))
                                            }
                                        />
                                        <ChoicePill
                                            selected={!answers.attendanceIntegration}
                                            label="目前不用"
                                            description="先把門禁流程做好，之後再看。"
                                            onClick={() =>
                                                setAnswers((current) => ({ ...current, attendanceIntegration: false }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="mb-3 text-sm font-bold text-slate-800">目前是什麼階段</div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {(Object.keys(ACCESS_STAGE_LABELS) as AccessProjectStage[]).map((projectStage) => (
                                        <ChoicePill
                                            key={projectStage}
                                            selected={answers.projectStage === projectStage}
                                            label={ACCESS_STAGE_LABELS[projectStage]}
                                            onClick={() => setAnswers((current) => ({ ...current, projectStage }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="ai-summary" className="space-y-6">
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">3. 看結果</div>
                            <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(160deg,#0f172a_0%,#172554_55%,#1e293b_100%)] p-6 text-white shadow-2xl shadow-slate-900/10 md:p-8">
                                <div className="text-xs font-bold tracking-[0.24em] text-sky-200">CONSULT RESULT</div>
                                <div className="mt-3 text-sm font-bold text-slate-300">目前比較適合的方向</div>
                                <h3 className="mt-3 text-3xl font-black md:text-5xl">{recommendation.architecture}</h3>
                                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100">
                                    {recommendation.architectureDescription} {recommendation.openingRecommendation}
                                </p>

                                <div className="mt-8 grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                        <div className="text-xs font-bold tracking-[0.18em] text-slate-300">建議開門方式</div>
                                        <div className="mt-2 text-lg font-black text-white">{recommendation.openingRecommendation}</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                        <div className="text-xs font-bold tracking-[0.18em] text-slate-300">系統偏好</div>
                                        <div className="mt-2 text-2xl font-black text-white">
                                            {recommendation.planPreferences.join(' / ')}
                                        </div>
                                        <div className="mt-2 text-sm leading-7 text-slate-100">這是目前較接近的規劃等級，不是正式報價。</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                        <div className="text-xs font-bold tracking-[0.18em] text-slate-300">送出時會帶上的摘要</div>
                                        <div className="mt-2 text-sm leading-7 text-slate-100">
                                            場域、門數、訪客、管理需求和這份建議都會一起送給工程師。
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                                    <div>
                                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">規劃摘要</div>
                                        <div className="mt-4 space-y-3">
                                            {consultationMeta.aiSummary.slice(0, 6).map((line) => (
                                                <div
                                                    key={line}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600"
                                                >
                                                    {line}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">先注意這些</div>
                                            <div className="mt-4 space-y-3">
                                                {recommendation.keyPoints.map((item) => (
                                                    <div key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-900">
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">容易漏掉的點</div>
                                            <div className="mt-4 space-y-3">
                                                {recommendation.risks.map((item) => (
                                                    <div key={item} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">下一步</div>
                                <h3 className="mt-2 text-2xl font-black text-slate-950">如果你願意，這份結果可以直接接著細化</h3>
                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                    你可以先看結果就好；也可以把施工資料補上，讓工程師直接照這份方向往下確認門型、設備與後續估價。
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={revealContactForm}
                                        className="rounded-full bg-[#1d4ed8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1e40af]"
                                    >
                                        請工程師協助細化方案
                                    </button>
                                    <Link
                                        href="/services/access-control"
                                        className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                                    >
                                        了解門禁系統服務
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </section>

            {showContactForm ? (
                <section id="consult-contact" className="mx-auto max-w-6xl px-4 pb-14">
                    <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-8">
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">4. 補施工資料</div>
                            <h2 className="mt-2 text-3xl font-black text-slate-950">把基本資訊補上，我們就能照這份方向接著看</h2>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                                你前面填的門禁條件會一起附上，不用重填。這段只補聯絡與施工資訊，方便工程師更快回覆。
                            </p>
                        </div>

                        <StepContactInfo
                            data={contactFormData}
                            onChange={updateContactPatch}
                            errors={contactErrors}
                            onTurnstileToken={setTurnstileToken}
                            honeypotValue={honeypot}
                            onHoneypotChange={setHoneypot}
                        />

                        {error ? (
                            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                        ) : null}

                        <div className="mt-8 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="rounded-full bg-efan-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-efan-accent-dark disabled:opacity-60"
                            >
                                {submitting ? '送出中...' : '送出快速諮詢'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowContactForm(false)}
                                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                            >
                                先不送，回去看結果
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}

            <section className="border-y border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl space-y-12 px-4 py-14">
                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">EXAMPLES</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">常見場景怎麼看</h2>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {ACCESS_CONTROL_QUICK_CONSULTATION_EXAMPLES.map((item) => (
                                <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                                    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800">{item.inputs}</div>
                                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FOR TAIPEI PROJECTS</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">台北辦公室、診所與店面怎麼用這支工具</h2>
                        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                            <p>對台北商辦來說，門禁最常卡住的不是設備型號，而是門型、訪客流程、樓管限制與管理角色沒有先想清楚。</p>
                            <p>這支工具的作用，就是先把門數、開門偏好、訪客和遠端管理需求整理成一致方向，讓你在正式談施工前先抓到重點。</p>
                            <p>如果後面要接工程師規劃、正式報價，甚至未來接 AI 初步估算，這份摘要都會比零散口述更好接手。</p>
                        </div>
                        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                            <div className="text-sm font-bold text-amber-900">規劃提醒</div>
                            <p className="mt-2 text-sm leading-7 text-amber-900/80">
                                工具結果適合前期抓方向；正式施工前，仍建議把門片材質、門框條件、供電、消防聯動與樓管限制一起確認。
                            </p>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">PRODUCTS</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">相關產品導購</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-500">如果你已經抓到方向，下面這幾類產品可以直接接著看。</p>
                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {ACCESS_CONTROL_PRODUCT_GUIDES.map((product) => (
                                <article key={product.title} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#fcfbf8] shadow-sm">
                                    <div className="relative aspect-[16/10] bg-white">
                                        <Image
                                            src={product.image}
                                            alt={product.alt}
                                            fill
                                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                            unoptimized={shouldBypassImageOptimization(product.image)}
                                            className="object-contain p-6"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-black text-slate-950">{product.title}</h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-600">{product.description}</p>
                                        <div className="mt-5">
                                            <Link
                                                href={product.href}
                                                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8]"
                                            >
                                                {product.cta}
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">常見問題</h2>
                        <div className="mt-8 space-y-3">
                            {ACCESS_CONTROL_QUICK_CONSULTATION_FAQ_ITEMS.map((item, index) => (
                                <details key={item.question} className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                                        <span className="flex items-center gap-4">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                                                Q{index + 1}
                                            </span>
                                            <span className="text-sm font-bold text-slate-900 md:text-base">{item.question}</span>
                                        </span>
                                        <span className="text-xl font-bold text-slate-400 transition group-open:rotate-45">+</span>
                                    </summary>
                                    <div className="border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600">{item.answer}</div>
                                </details>
                            ))}
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
}
