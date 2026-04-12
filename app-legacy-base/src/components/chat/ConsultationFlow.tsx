'use client';

import './consultation.css';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ServiceType, ConsultationData } from '@/lib/types/consultation-types';
import { INITIAL_CONSULTATION_DATA } from '@/lib/types/consultation-types';
import ProgressBar from './ProgressBar';
import ServiceSelector from './ServiceSelector';
import ServiceDetails from './ServiceDetails';
import ContactForm, { type ContactInfo } from './ContactForm';
import CompletionView from './CompletionView';
import TransferHuman from './TransferHuman';
import IdlePrompt from './IdlePrompt';

// ─── Step ID Type ───────────────────────────────────────────────

type StepId =
    | 'services'
    | 'access_control' | 'cctv' | 'phone_system' | 'attendance' | 'network'
    | 'contact'
    | 'done'
    | 'transfer_form'
    | 'transfer_complete';

/** Services that have a dedicated detail step */
const SERVICE_STEPS: ServiceType[] = ['access_control', 'cctv', 'phone_system', 'attendance', 'network'];

function buildStepSequence(services: ServiceType[]): StepId[] {
    const steps: StepId[] = ['services'];
    for (const s of SERVICE_STEPS) {
        if (services.includes(s)) steps.push(s as StepId);
    }
    steps.push('contact');
    steps.push('done');
    return steps;
}

// ─── Props ──────────────────────────────────────────────────────

interface ConsultationFlowProps {
    onEnterFreeChat: (sessionId: string) => void;
    onSessionCreated?: (sessionId: string) => void;
    getTurnstileToken: () => Promise<string>;
}

const STORAGE_KEY = 'efan_chat_state';
const DEFAULT_IDLE_SECONDS = 60;
const DEFAULT_RESUME_MINUTES = 60;

// ─── Component ──────────────────────────────────────────────────

export default function ConsultationFlow({
    onEnterFreeChat,
    onSessionCreated,
    getTurnstileToken,
}: ConsultationFlowProps) {
    const [step, setStep] = useState<StepId>('services');
    const [data, setData] = useState<ConsultationData>({ ...INITIAL_CONSULTATION_DATA });
    const [otherDescription, setOtherDescription] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
    const [quoteNumber, setQuoteNumber] = useState<string | undefined>(undefined);
    const [showIdle, setShowIdle] = useState(false);
    const [showResume, setShowResume] = useState(false);
    const [error, setError] = useState('');
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const idleFiredRef = useRef(false);

    // Dynamic step sequence
    const steps = buildStepSequence(data.services);

    // Current step index in the sequence
    const currentIdx = steps.indexOf(step);

    // ── Session Recovery ────────────────────────────────────────

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            const parsed = JSON.parse(saved);
            const age = Date.now() - (parsed.timestamp || 0);
            if (age > DEFAULT_RESUME_MINUTES * 60 * 1000) {
                sessionStorage.removeItem(STORAGE_KEY);
                return;
            }
            setShowResume(true);
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const resumeSession = () => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            const parsed = JSON.parse(saved);
            setData({
                services: parsed.services || [],
                details: parsed.details || {},
                budgetTiers: parsed.budgetTiers || [],
            });
            setOtherDescription(parsed.otherDescription || '');
            // Navigate to saved step, defaulting to 'services' if not valid
            setStep(parsed.step || 'services');
        } catch {
            // fallback: start fresh
        }
        setShowResume(false);
    };

    const restartSession = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setData({ ...INITIAL_CONSULTATION_DATA });
        setOtherDescription('');
        setStep('services');
        setShowResume(false);
    };

    // ── Save state to sessionStorage ────────────────────────────

    useEffect(() => {
        if (step !== 'done' && step !== 'transfer_form' && step !== 'transfer_complete') {
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                    step,
                    services: data.services,
                    details: data.details,
                    otherDescription,
                    timestamp: Date.now(),
                }));
            } catch { }
        }
    }, [step, data.services, data.details, otherDescription]);

    // ── Idle Timer (detail steps only) ──────────────────────────

    const isDetailStep = SERVICE_STEPS.includes(step as ServiceType);

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (isDetailStep && !idleFiredRef.current) {
            idleTimerRef.current = setTimeout(() => {
                setShowIdle(true);
                idleFiredRef.current = true;
            }, DEFAULT_IDLE_SECONDS * 1000);
        }
    }, [isDetailStep]);

    useEffect(() => {
        resetIdleTimer();
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [resetIdleTimer]);

    const onInteraction = () => resetIdleTimer();

    // ── Navigation ──────────────────────────────────────────────

    const goNext = () => {
        const nextIdx = currentIdx + 1;
        if (nextIdx < steps.length) {
            setDirection('next');
            setStep(steps[nextIdx]);
        }
    };

    const goPrev = () => {
        const prevIdx = currentIdx - 1;
        if (prevIdx >= 0) {
            setDirection('prev');
            setStep(steps[prevIdx]);
        }
    };

    // ── Submission ──────────────────────────────────────────────

    const handleConsultationSubmit = async (contact: ContactInfo) => {
        setError('');
        try {
            const turnstileToken = await getTurnstileToken();

            const res = await fetch('/api/public/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'consultation',
                    visitorName: contact.contactName,
                    visitorContact: contact.phone,
                    visitorEmail: contact.email,
                    visitorLineId: contact.lineId || undefined,
                    consultationData: data,
                    installLocation: contact.address,
                    companyName: contact.companyName || undefined,
                    message: contact.message || undefined,
                    otherDescription: otherDescription || undefined,
                    turnstileToken,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || '送出失敗');
            }

            const result = await res.json();
            setSessionId(result.sessionId);
            setQuoteNumber(result.quoteNumber);
            setContactInfo(contact);
            onSessionCreated?.(result.sessionId);
            sessionStorage.removeItem(STORAGE_KEY);
            setDirection('next');
            setStep('done');
        } catch (err: any) {
            setError(err.message || '送出失敗，請稍後再試');
        }
    };

    const handleTransferSubmit = async (contact: ContactInfo) => {
        setError('');
        try {
            const turnstileToken = await getTurnstileToken();

            const res = await fetch('/api/public/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'transfer_request',
                    visitorName: contact.contactName,
                    visitorContact: contact.phone,
                    visitorEmail: contact.email,
                    visitorLineId: contact.lineId || undefined,
                    consultationData: data.services.length > 0 ? data : undefined,
                    installLocation: contact.address,
                    companyName: contact.companyName || undefined,
                    message: contact.message || undefined,
                    turnstileToken,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || '送出失敗');
            }

            const result = await res.json();
            setSessionId(result.sessionId);
            setContactInfo(contact);
            onSessionCreated?.(result.sessionId);
            setStep('transfer_complete');
        } catch (err: any) {
            setError(err.message || '送出失敗，請稍後再試');
        }
    };

    const handleEnterChat = async () => {
        // Enter free chat — AI active, user can transfer via chat UI button
        if (sessionId) {
            onEnterFreeChat(sessionId);
        } else if (contactInfo) {
            // Fallback: create a new session
            try {
                const turnstileToken = await getTurnstileToken();
                const res = await fetch('/api/public/chat/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'web_home',
                        pageUrl: window.location.href,
                        visitorName: contactInfo.contactName,
                        visitorContact: contactInfo.phone,
                        turnstileToken,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    onEnterFreeChat(data.sessionId);
                }
            } catch (e) {
                console.error('Fallback session creation failed:', e);
            }
        }
    };

    // ── Resume Dialog ───────────────────────────────────────────

    if (showResume) {
        return (
            <div className="consultation-step">
                <div className="resume-dialog">
                    <p className="resume-title">您有未完成的諮詢，是否繼續？</p>
                    <div className="resume-actions">
                        <button type="button" className="consultation-btn consultation-btn-primary" onClick={resumeSession}>
                            繼續
                        </button>
                        <button type="button" className="consultation-btn consultation-btn-secondary" onClick={restartSession}>
                            重新開始
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Progress calculation ────────────────────────────────────

    // For progress bar: only show during main flow steps (services → contact)
    const mainSteps = steps.filter(s => s !== 'done');
    const progressIdx = (mainSteps as string[]).indexOf(step);
    const showProgress = progressIdx >= 0 && step !== 'done' && step !== 'transfer_form' && step !== 'transfer_complete';

    // Build dynamic labels
    const progressLabels = mainSteps.map(s => {
        if (s === 'services') return '選擇服務';
        if (s === 'contact') return '聯絡資料';
        const labelMap: Record<string, string> = { access_control: '門禁', cctv: '監視', phone_system: '總機', attendance: '考勤', network: '網路' };
        const label = labelMap[s];
        return label || s;
    });

    return (
        <div className="consultation-flow" onClick={isDetailStep ? onInteraction : undefined}>
            {/* Progress Bar */}
            {showProgress && (
                <ProgressBar
                    currentStep={progressIdx + 1}
                    totalSteps={mainSteps.length}
                    labels={progressLabels}
                />
            )}

            {/* Error Banner */}
            {error && (
                <div className="consultation-error">
                    <p>{error}</p>
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            {/* Step content with slide animation */}
            <div
                key={step}
                className={`consultation-step-animated ${direction === 'next' ? 'slide-in-right' : 'slide-in-left'}`}
            >
                {step === 'services' && (
                    <ServiceSelector
                        selected={data.services}
                        onChange={services => setData({ ...data, services })}
                        onNext={goNext}
                        onTransferHuman={() => setStep('transfer_form')}
                        otherDescription={otherDescription}
                        onOtherDescriptionChange={setOtherDescription}
                    />
                )}

                {SERVICE_STEPS.includes(step as ServiceType) && (
                    <>
                        <ServiceDetails
                            service={step as ServiceType}
                            details={data.details as any}
                            onChange={details => { setData({ ...data, details: details as any }); onInteraction(); }}
                            onPrev={goPrev}
                            onNext={goNext}
                            stepLabel={data.services.filter(s => SERVICE_STEPS.includes(s)).length > 1
                                ? `服務 ${data.services.filter(s => SERVICE_STEPS.includes(s)).indexOf(step as ServiceType) + 1}/${data.services.filter(s => SERVICE_STEPS.includes(s)).length}`
                                : undefined
                            }
                        />
                        {showIdle && (
                            <IdlePrompt
                                onLeaveContact={() => { setShowIdle(false); setDirection('next'); setStep('contact'); }}
                                onContinue={() => setShowIdle(false)}
                            />
                        )}
                    </>
                )}

                {step === 'contact' && (
                    <ContactForm
                        consultationData={data}
                        onPrev={goPrev}
                        onSubmit={handleConsultationSubmit}
                    />
                )}

                {step === 'done' && (
                    <CompletionView
                        email={contactInfo?.email}
                        quoteNumber={quoteNumber}
                        onFreeChat={handleEnterChat}
                        onTransferHuman={handleEnterChat}
                    />
                )}

                {step === 'transfer_form' && (
                    <ContactForm
                        consultationData={data}
                        onPrev={() => setStep('services')}
                        onSubmit={handleTransferSubmit}
                        transferMode
                    />
                )}

                {step === 'transfer_complete' && (
                    <TransferHuman
                        hasContactInfo={!!contactInfo}
                        onTransferDirect={handleEnterChat}
                        onBack={() => setStep(contactInfo ? 'done' : 'services')}
                    />
                )}
            </div>
        </div>
    );
}
