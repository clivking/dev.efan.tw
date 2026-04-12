'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface CompletionViewProps {
    email?: string;
    quoteNumber?: string;
    onFreeChat: () => void;
    onTransferHuman: () => void;
}

export default function CompletionView({ email, quoteNumber, onFreeChat, onTransferHuman }: CompletionViewProps) {
    const [lineQrUrl, setLineQrUrl] = useState('');
    const [lineId, setLineId] = useState('');

    useEffect(() => {
        fetch('/api/public/settings?keys=line_qrcode_url,line_official_id')
            .then(r => r.json())
            .then(data => {
                if (data.line_qrcode_url) setLineQrUrl(data.line_qrcode_url);
                if (data.line_official_id) setLineId(data.line_official_id);
            })
            .catch(() => {});
    }, []);

    return (
        <div className="consultation-step completion-view">
            <div className="completion-header">
                <div className="completion-icon-animated">✅</div>
                <h3 className="completion-title">詢價已送出！</h3>
            </div>

            <div className="completion-info">
                {quoteNumber && (
                    <p>
                        報價單編號：<strong className="completion-quote-number">{quoteNumber}</strong>
                    </p>
                )}
                {email && (
                    <p>📧 確認信已寄到 <strong>{email}</strong></p>
                )}
                <p>📞 我們會盡快與您聯繫並提供報價</p>
            </div>

            {/* LINE QR Code */}
            {(lineQrUrl || lineId) && (
                <div className="completion-line-section">
                    <p className="completion-line-title">加 LINE 好友，報價更快送達 👇</p>
                    {lineQrUrl && (
                        <div className="completion-qr-container">
                            <Image
                                src={lineQrUrl}
                                alt="LINE QR Code"
                                width={160}
                                height={160}
                                className="completion-qr-image"
                                unoptimized
                            />
                        </div>
                    )}
                    {lineId && (
                        <p className="completion-line-id">LINE ID：{lineId}</p>
                    )}
                </div>
            )}

            <div className="completion-phone">
                <p>如有急件請撥 <a href="tel:02-7730-1158">02-7730-1158</a></p>
            </div>

            <div className="completion-actions">
                <button
                    type="button"
                    className="consultation-btn completion-btn-chat"
                    onClick={onFreeChat}
                >
                    💬 我還有問題想問
                </button>
                <button
                    type="button"
                    className="consultation-btn completion-btn-transfer"
                    onClick={onTransferHuman}
                >
                    👤 轉接真人客服
                </button>
            </div>
        </div>
    );
}
