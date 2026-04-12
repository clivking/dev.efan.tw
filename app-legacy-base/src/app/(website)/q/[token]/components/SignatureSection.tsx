'use client';

import Image from 'next/image';
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas, { SignatureCanvasRef } from './SignatureCanvas';
import FullscreenSignature from './FullscreenSignature';

interface SignatureSectionProps {
    token: string;
    quoteId: string;
    quoteStatus: string;
    existingSignature: {
        signerName: string;
        signerTitle?: string | null;
        signatureImage: string;
        signedAt: string;
    } | null;
    selectedVariantId?: string | null;
}

export default function SignatureSection({ token, quoteId, quoteStatus, existingSignature, selectedVariantId }: SignatureSectionProps) {
    const canvasRef = useRef<SignatureCanvasRef>(null);
    const [signerName, setSignerName] = useState('');
    const [signerTitle, setSignerTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasWidth, setCanvasWidth] = useState(0);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const updateWidth = () => {
            if (containerRef.current) {
                setCanvasWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const isSigned = quoteStatus !== 'sent' && quoteStatus !== 'draft' && quoteStatus !== 'confirmed';
    const displaySignature = success || (isSigned && existingSignature);

    const handleSubmit = async () => {
        if (!signerName.trim()) {
            setError('請填寫簽名人姓名');
            return;
        }

        if (!canvasRef.current || canvasRef.current.isEmpty()) {
            setError('請在簽名板上簽名');
            return;
        }

        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);
        setError(null);

        try {
            const signatureImage = canvasRef.current?.toDataURL();
            const response = await fetch(`/api/public/q/${token}/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signerName,
                    signerTitle,
                    signatureImage,
                    variantId: selectedVariantId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Dispatch an event so the parent can refresh the content if needed
                window.dispatchEvent(new CustomEvent('quote-signed'));
            } else {
                setError(data.message || '簽回失敗，請稍後再試');
            }
        } catch (err) {
            setError('網路請求失敗，請檢查連線');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (displaySignature) {
        const sig = existingSignature || {
            signerName,
            signerTitle,
            signedAt: new Date().toISOString(),
            signatureImage: canvasRef.current?.toDataURL() || ''
        };

        return (
            <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17L4 12"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">報價單已簽回</h3>
                        <p className="text-sm text-gray-500">感謝您的確認，我們將盡快為您處理。</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
                    <div>
                        <div className="mb-4">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">簽名人</label>
                            <div className="text-lg font-bold text-gray-800">
                                {sig.signerName} {sig.signerTitle ? `/ ${sig.signerTitle}` : ''}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">簽署時間</label>
                            <div className="text-sm text-gray-600">
                                {mounted ? new Date(sig.signedAt).toLocaleString('zh-TW') : ''}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border p-2 flex items-center justify-center">
                        <Image src={sig.signatureImage.startsWith('/uploads/') ? `/api${sig.signatureImage}` : sig.signatureImage} alt="Signature" width={320} height={128} unoptimized className="max-h-32 w-auto object-contain" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">確認簽回</h3>
            <p className="text-sm text-gray-500 mb-8">請正確填寫姓名並在下方簽名以確認此報價單。</p>

            <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            簽名人姓名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="請輸入姓名"
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1B3A5C]/10 focus:border-[#1B3A5C] outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">職稱 (選填)</label>
                        <input
                            type="text"
                            value={signerTitle}
                            onChange={(e) => setSignerTitle(e.target.value)}
                            placeholder="例如：王經理"
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1B3A5C]/10 focus:border-[#1B3A5C] outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-bold text-gray-700">請在下方空白處簽名</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => canvasRef.current?.undo()}
                                className="text-xs text-gray-500 hover:text-gray-900"
                            >
                                ↩ 撤銷
                            </button>
                            <button
                                onClick={() => canvasRef.current?.clear()}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                🗑 清除
                            </button>
                        </div>
                    </div>

                    <div className="relative group" ref={containerRef}>
                        {canvasWidth > 0 && (
                            <SignatureCanvas
                                ref={canvasRef}
                                width={canvasWidth}
                                height={260}
                                className="w-full rounded-xl border-dashed border-2 hover:border-[#1B3A5C] transition-colors pointer-events-auto"
                            />
                        )}
                        {isMobile && (
                            <button
                                onClick={() => setShowFullscreen(true)}
                                className="absolute inset-0 flex items-center justify-center bg-gray-900/40 text-white rounded-xl opacity-0 group-active:opacity-100 transition-opacity"
                            >
                                <div className="flex flex-col items-center">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                                    </svg>
                                    <span className="text-sm mt-1 font-bold">點擊進入全螢幕簽名</span>
                                </div>
                            </button>
                        )}
                    </div>

                    {isMobile && (
                        <button
                            onClick={() => setShowFullscreen(true)}
                            className="w-full mt-3 py-2 flex items-center justify-center gap-2 text-sm text-[#1B3A5C] border border-[#1B3A5C] rounded-lg active:bg-blue-50"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                            進入全螢幕簽名模式
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#1B3A5C] text-white rounded-xl font-bold text-lg hover:bg-blue-900 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            簽回中...
                        </>
                    ) : (
                        <>✅ 確認簽回報價單</>
                    )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                    ⚠ 簽回後報價內容將不可修改，視同正式法律簽發。
                </p>
            </div>

            <FullscreenSignature
                isOpen={showFullscreen}
                onClose={() => setShowFullscreen(false)}
                onConfirm={(dataUrl) => {
                    canvasRef.current?.fromDataURL(dataUrl);
                    setError(null);
                }}
            />

            {/* Basic confirmation modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-[#1B3A5C] rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">確認簽回</h4>
                            <p className="text-sm text-gray-600">
                                您即將簽回此報價單。<br />
                                簽回後報價內容將不可修改。<br />
                                確定要簽回嗎？
                            </p>
                        </div>
                        <div className="flex border-t">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmSubmit}
                                className="flex-1 py-4 text-[#1B3A5C] font-bold border-l hover:bg-blue-50 transition-colors"
                            >
                                確認簽回
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
