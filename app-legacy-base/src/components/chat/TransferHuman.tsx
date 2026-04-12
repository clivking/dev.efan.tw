'use client';

import { useState } from 'react';

interface TransferHumanProps {
    /** If true, skip the confirmation and directly trigger the transfer */
    hasContactInfo: boolean;
    onTransferDirect: () => Promise<void>;
    onBack: () => void;
}

export default function TransferHuman({ hasContactInfo, onTransferDirect, onBack }: TransferHumanProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
    const [businessHours, setBusinessHours] = useState<{ isOpen: boolean; hours: string } | null>(null);

    const doTransfer = async () => {
        setStatus('loading');
        try {
            // Fetch business hours
            const bh = await fetch('/api/public/business-hours').then(r => r.json()).catch(() => ({ isOpen: false, hours: '週一至週五 09:00-18:00' }));
            setBusinessHours(bh);

            await onTransferDirect();
            setStatus('done');
        } catch (e) {
            console.error('Transfer error:', e);
            setStatus('idle');
        }
    };

    // Auto-trigger if has contact info (from Step 4)
    if (hasContactInfo && status === 'idle') {
        doTransfer();
    }

    if (status === 'loading') {
        return (
            <div className="consultation-step transfer-view">
                <div className="transfer-loading">
                    <div className="transfer-spinner" />
                    <p>正在轉接...</p>
                </div>
            </div>
        );
    }

    if (status === 'done') {
        return (
            <div className="consultation-step transfer-view">
                <div className="transfer-done">
                    {businessHours?.isOpen ? (
                        <>
                            <p className="transfer-done-title">✅ 已收到！專人會盡快與您聯繫。</p>
                            <p>📞 也可直接撥打 <a href="tel:02-7730-1158">02-7730-1158</a></p>
                        </>
                    ) : (
                        <>
                            <p className="transfer-done-title">✅ 已收到！</p>
                            <p>目前非營業時間（{businessHours?.hours || '週一至週五 09:00-18:00'}），</p>
                            <p>專人會在下個營業日盡快與您聯繫。</p>
                            <p>📞 急件請撥 <a href="tel:02-7730-1158">02-7730-1158</a></p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return null; // The form is handled in ContactForm with transferMode=true
}
