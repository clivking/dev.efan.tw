'use client';

import { useState, useCallback, useEffect } from 'react';
import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import { withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { QuoteRequestData, ServiceType, INITIAL_DATA } from './lib/quote-request-types';
import ProgressBar from './components/ProgressBar';
import StepServices from './components/StepServices';
import StepAccessControl from './components/StepAccessControl';
import StepCCTV from './components/StepCCTV';
import StepPhoneSystem from './components/StepPhoneSystem';
import StepAttendance from './components/StepAttendance';
import StepNetwork from './components/StepNetwork';
import StepContactInfo from './components/StepContactInfo';
import ThankYou from './components/ThankYou';

type StepId = 'services' | 'access_control' | 'cctv' | 'phone_system' | 'attendance' | 'network' | 'contact';

/** Services that have a dedicated detail page (excludes 'other') */
const SERVICE_STEPS: StepId[] = ['access_control', 'cctv', 'phone_system', 'attendance', 'network'];

function buildStepSequence(services: ServiceType[]): StepId[] {
    const steps: StepId[] = ['services'];
    for (const s of SERVICE_STEPS) {
        if (services.includes(s as ServiceType)) steps.push(s);
    }
    steps.push('contact');
    return steps;
}

const STORAGE_KEY = 'efan_quote_draft';

export default function QuoteRequestClient() {
    const [data, setData] = useState<QuoteRequestData>(() => {
        // Restore from localStorage if available
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) return JSON.parse(saved);
            } catch { /* ignore */ }
        }
        return { ...INITIAL_DATA };
    });
    const [currentIdx, setCurrentIdx] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [quoteNumber, setQuoteNumber] = useState('');
    const [error, setError] = useState('');
    const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
    const [honeypot, setHoneypot] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');

    // Save to localStorage on every change
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    }, [data]);

    const steps = buildStepSequence(data.services);
    const totalSteps = steps.length;
    const currentStep = steps[currentIdx] || 'services';
    const isLast = currentIdx === totalSteps - 1;

    const onChange = useCallback((patch: Partial<QuoteRequestData>) => {
        setData(prev => ({ ...prev, ...patch }));
    }, []);

    const canGoNext = (): boolean => {
        if (currentStep === 'services') {
            if (data.services.length === 0) return false;
            // If 'other' is selected, require description
            if (data.services.includes('other') && !data.otherDescription.trim()) {
                setError('請描述您的「其他需求」內容');
                return false;
            }
            return true;
        }
        if (currentStep === 'contact') {
            const errs: Record<string, string> = {};
            if (!data.contactName.trim()) errs.contactName = '請填寫聯絡人姓名';
            if (!data.phone.trim()) errs.phone = '請填寫電話或手機';
            if (data.phone.trim()) {
                const clean = data.phone.replace(/[-\s]/g, '');
                if (/^09/.test(clean) && !/^09\d{8}$/.test(clean)) {
                    errs.phone = '手機格式：09 開頭 10 碼';
                }
            }
            if (!data.email.trim()) {
                errs.email = '請填寫 Email';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
                errs.email = 'Email 格式不正確';
            }
            if (!data.address.trim()) errs.address = '請填寫安裝地址';
            setContactErrors(errs);
            return Object.keys(errs).length === 0;
        }
        return true;
    };

    const goNext = () => {
        if (!canGoNext()) return;
        setError('');
        if (isLast) {
            handleSubmit();
        } else {
            const newSteps = buildStepSequence(data.services);
            const nextIdx = Math.min(currentIdx + 1, newSteps.length - 1);
            setDirection('next');
            setCurrentIdx(nextIdx);
        }
    };

    const goPrev = () => {
        if (currentIdx > 0) {
            setDirection('prev');
            setError('');
            setContactErrors({});
            setCurrentIdx(currentIdx - 1);
        }
    };

    // Keyboard Enter
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey && !submitting && !submitted) {
                // Don't trigger on textarea
                if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
                e.preventDefault();
                goNext();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            // Smart phone detection: 09xx = mobile, else = landline
            const rawPhone = data.phone.replace(/[-\s]/g, '');
            const isMobile = /^09/.test(rawPhone);

            const payload = {
                services: data.services,
                details: {
                    access_control: data.details.accessControl || undefined,
                    cctv: data.details.cctv || undefined,
                    phone_system: data.details.phoneSystem || undefined,
                    attendance: data.details.attendance || undefined,
                    network: data.details.network || undefined,
                },
                otherDescription: data.otherDescription || null,
                companyName: data.companyName || null,
                contactName: data.contactName,
                mobile: isMobile ? data.phone : null,
                phone: isMobile ? null : data.phone,
                address: data.address || null,
                email: data.email || null,
                message: data.message || null,
                website: honeypot || undefined,
                turnstileToken: turnstileToken || undefined,
            };

            const res = await fetch('/api/public/quote-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                setError(json.error || '提交失敗，請稍後再試');
                setSubmitting(false);
                return;
            }

            // Clear localStorage on success
            try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }

            setQuoteNumber(json.quoteNumber);
            setSubmitted(true);
        } catch {
            setError('網路錯誤，請稍後再試或直接撥打電話');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg">
                    <div className="mb-6 flex justify-center">
                        <BreadcrumbTrail items={withHomeBreadcrumb('快速報價')} tone="light" />
                    </div>
                    <ThankYou quoteNumber={quoteNumber} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl">
                <div className="mb-6 flex justify-center">
                    <BreadcrumbTrail items={withHomeBreadcrumb('快速報價')} tone="light" />
                </div>
                <ProgressBar current={currentIdx + 1} total={totalSteps} />

                {/* Step content with animation */}
                <div
                    key={currentStep}
                    className={`animate-fade-in ${direction === 'next' ? 'animate-slide-left' : 'animate-slide-right'}`}
                >
                    {currentStep === 'services' && <StepServices data={data} onChange={onChange} />}
                    {currentStep === 'access_control' && <StepAccessControl data={data} onChange={onChange} />}
                    {currentStep === 'cctv' && <StepCCTV data={data} onChange={onChange} />}
                    {currentStep === 'phone_system' && <StepPhoneSystem data={data} onChange={onChange} />}
                    {currentStep === 'attendance' && <StepAttendance data={data} onChange={onChange} />}
                    {currentStep === 'network' && <StepNetwork data={data} onChange={onChange} />}
                    {currentStep === 'contact' && (
                        <StepContactInfo
                            data={data}
                            onChange={onChange}
                            errors={contactErrors}
                            onTurnstileToken={setTurnstileToken}
                            honeypotValue={honeypot}
                            onHoneypotChange={setHoneypot}
                        />
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 gap-4">
                    {currentIdx > 0 ? (
                        <button type="button" onClick={goPrev}
                            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">
                            ← 上一步
                        </button>
                    ) : <div />}

                    <button
                        type="button"
                        onClick={goNext}
                        disabled={submitting}
                        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                            active:scale-95 disabled:opacity-50 hover:shadow-xl hover:scale-[1.02]
                            ${isLast
                                ? 'bg-efan-accent hover:bg-efan-accent-dark shadow-efan-accent/20'
                                : 'bg-efan-primary hover:bg-efan-primary-light shadow-efan-primary/20'
                            }`}
                    >
                        {submitting ? '送出中...' : isLast ? '送出詢價 ✓' : '下一步 →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
