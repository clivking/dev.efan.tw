'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { shouldBypassImageOptimization } from '@/lib/image-paths';

interface SignatureData {
    id: string;
    signerName: string;
    signerTitle: string | null;
    signatureImage: string;
    signedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
}

interface QuoteSignaturePanelProps {
    quoteId: string;
    status: string;
}

export default function QuoteSignaturePanel({ quoteId, status }: QuoteSignaturePanelProps) {
    const [signature, setSignature] = useState<SignatureData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSignature = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/quotes/${quoteId}/signature`);
            if (res.ok) {
                const data = await res.json();
                setSignature(data.signature);
            }
        } catch (e) {
            console.error('Failed to fetch signature:', e);
        } finally {
            setLoading(false);
        }
    }, [quoteId]);

    useEffect(() => {
        if (['signed', 'construction', 'completed', 'paid'].includes(status)) {
            fetchSignature();
        }
    }, [fetchSignature, status]);

    if (!['signed', 'construction', 'completed', 'paid'].includes(status)) {
        return null;
    }

    if (loading) {
        return (
            <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-20 rounded-xl bg-gray-50" />
            </div>
        );
    }

    if (!signature) {
        return (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-400">客戶簽名</h3>
                <p className="py-4 text-center text-xs font-bold text-gray-400">目前尚未收到簽名。</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">客戶簽名紀錄</h3>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex w-full justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-inner">
                    <Image
                        src={signature.signatureImage}
                        alt="Customer Signature"
                        width={320}
                        height={96}
                        unoptimized={shouldBypassImageOptimization(signature.signatureImage)}
                        className="max-h-24 w-auto object-contain"
                    />
                </div>

                <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-400">簽署人</span>
                        <span className="font-black text-efan-primary">
                            {signature.signerName} {signature.signerTitle ? `/ ${signature.signerTitle}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-400">簽署時間</span>
                        <span className="font-medium text-gray-600">
                            {new Date(signature.signedAt).toLocaleString('zh-TW', { hour12: false })}
                        </span>
                    </div>
                    <div className="my-1 h-px bg-gray-200" />
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-gray-400">來源 IP</span>
                        <span className="font-mono text-gray-500">{signature.ipAddress || '未提供'}</span>
                    </div>
                </div>
            </div>

            <details className="text-[10px]">
                <summary className="mb-1 cursor-pointer font-bold text-gray-400 hover:text-gray-600">查看瀏覽器資訊（User Agent）</summary>
                <div className="break-all rounded-lg bg-gray-50 p-2 font-mono leading-normal text-gray-400">
                    {signature.userAgent || '未提供'}
                </div>
            </details>
        </div>
    );
}
