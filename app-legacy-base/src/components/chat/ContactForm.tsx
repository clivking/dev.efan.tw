'use client';

import { useState } from 'react';
import { SERVICE_LABELS } from '@/lib/types/consultation-types';
import type { ServiceType, ConsultationData } from '@/lib/types/consultation-types';

interface ContactFormProps {
    consultationData: ConsultationData;
    onPrev: () => void;
    onSubmit: (contactInfo: ContactInfo) => Promise<void>;
    /** If true, hide the summary (used for transfer-human form) */
    transferMode?: boolean;
}

export interface ContactInfo {
    contactName: string;
    phone: string;
    email: string;
    address: string;
    lineId: string;
    companyName: string;
    message: string;
}

export default function ContactForm({
    consultationData,
    onPrev,
    onSubmit,
    transferMode = false,
}: ContactFormProps) {
    const [contact, setContact] = useState<ContactInfo>({
        contactName: '',
        phone: '',
        email: '',
        address: '',
        lineId: '',
        companyName: '',
        message: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Build tag-style summary
    const summaryTags: { icon: string; text: string }[] = [];
    if (!transferMode) {
        for (const s of consultationData.services) {
            if (s === 'other') {
                summaryTags.push({ icon: '📝', text: '其他需求' });
            } else {
                const label = SERVICE_LABELS[s];
                let detail = label.name;
                const d = (consultationData.details as any)[s === 'phone_system' ? 'phone_system' : s];
                if (s === 'access_control' && d?.doorCount) detail += `（${d.doorCount}門）`;
                if (s === 'cctv' && d?.cameraCount) detail += `（${d.cameraCount}台）`;
                if (s === 'phone_system' && d) detail += `（外${d.externalLines || 3}內${d.extensions || 8}）`;
                if (s === 'attendance' && d?.employeeCount) detail += `（${d.employeeCount}人）`;
                if (s === 'network' && d?.area) detail += `（${d.area}坪）`;
                summaryTags.push({ icon: label.icon, text: detail });
            }
        }
    }

    const cleanPhone = contact.phone.replace(/[-\s]/g, '');
    const showPhoneHint = cleanPhone.length >= 4;
    const isMobile = /^09/.test(cleanPhone);

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!contact.contactName.trim()) errs.contactName = '請填寫聯絡人姓名';
        if (!contact.phone.trim()) {
            errs.phone = '請填寫手機或電話';
        } else {
            const clean = contact.phone.replace(/[-\s]/g, '');
            const isMob = /^09\d{8}$/.test(clean);
            const isLandline = /^0\d{1,2}\d{6,8}$/.test(clean);
            if (!isMob && !isLandline) errs.phone = '請輸入正確的手機或電話號碼';
        }
        if (!contact.email.trim()) {
            errs.email = '請填寫 Email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
            errs.email = '請輸入正確的 Email 格式';
        }
        if (!contact.address.trim()) errs.address = '請填寫安裝地址';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await onSubmit(contact);
        } catch (err) {
            console.error('Submit error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const updateField = (field: keyof ContactInfo, value: string) => {
        setContact(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="consultation-step">
            {/* Summary Tags */}
            {!transferMode && summaryTags.length > 0 && (
                <div className="contact-summary-card">
                    <p className="contact-summary-title">📋 您的需求摘要</p>
                    <div className="contact-summary-tags">
                        {summaryTags.map((tag, i) => (
                            <span key={i} className="contact-summary-tag">
                                {tag.icon} {tag.text}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact Info Form */}
            <div className="consultation-contact-section">
                <p className="detail-section-label">
                    {transferMode ? '請先留下聯絡方式，方便專人與您聯繫：' : '── 聯絡資料 ──'}
                </p>

                <div className="form-field">
                    <label>公司名稱 <span style={{ color: '#9ca3af', fontWeight: 400 }}>（選填）</span></label>
                    <input
                        type="text"
                        value={contact.companyName}
                        onChange={e => updateField('companyName', e.target.value)}
                        placeholder="例如：ABC 科技有限公司"
                    />
                </div>

                <div className="form-field">
                    <label>聯絡人 <span className="required">*</span></label>
                    <input
                        type="text"
                        value={contact.contactName}
                        onChange={e => updateField('contactName', e.target.value)}
                        placeholder="您的姓名"
                        className={errors.contactName ? 'error' : ''}
                    />
                    {errors.contactName && <p className="form-error">{errors.contactName}</p>}
                </div>

                <div className="form-field">
                    <label>手機/電話 <span className="required">*</span></label>
                    <input
                        type="tel"
                        value={contact.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        placeholder="0912-345-678 或 02-7730-1158"
                        className={errors.phone ? 'error' : ''}
                    />
                    {showPhoneHint && (
                        <p className="form-phone-hint">
                            {isMobile ? '📱 偵測為手機號碼' : '📞 偵測為市話號碼'}
                        </p>
                    )}
                    {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>

                <div className="form-field">
                    <label>Email <span className="required">*</span></label>
                    <input
                        type="email"
                        value={contact.email}
                        onChange={e => updateField('email', e.target.value)}
                        placeholder="example@company.com"
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                <div className="form-field">
                    <label>安裝地址 <span className="required">*</span></label>
                    <input
                        type="text"
                        value={contact.address}
                        onChange={e => updateField('address', e.target.value)}
                        placeholder="台北市松山區..."
                        className={errors.address ? 'error' : ''}
                    />
                    {errors.address && <p className="form-error">{errors.address}</p>}
                </div>

                <div className="form-field">
                    <label>LINE ID <span style={{ color: '#9ca3af', fontWeight: 400 }}>（選填）</span></label>
                    <input
                        type="text"
                        value={contact.lineId}
                        onChange={e => updateField('lineId', e.target.value)}
                        placeholder="選填"
                    />
                </div>

                <div className="form-field">
                    <label>補充說明 <span style={{ color: '#9ca3af', fontWeight: 400 }}>（選填）</span></label>
                    <textarea
                        value={contact.message}
                        onChange={e => updateField('message', e.target.value)}
                        placeholder="例如：希望下週可以現場勘查，預算約 5 萬以內..."
                        rows={2}
                    />
                </div>
            </div>

            {/* Response time */}
            {!transferMode && (
                <div className="contact-response-time">
                    <span>⏱</span>
                    <span>營業時間內 2 小時回覆報價</span>
                </div>
            )}

            <div className="consultation-actions consultation-actions-between">
                <button
                    type="button"
                    className="consultation-btn consultation-btn-secondary"
                    onClick={onPrev}
                    disabled={submitting}
                >
                    ← {transferMode ? '返回' : '上一步'}
                </button>
                <button
                    type="button"
                    className="consultation-btn consultation-btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? '送出中...' : (transferMode ? '送出 →' : '📩 送出諮詢')}
                </button>
            </div>
        </div>
    );
}
