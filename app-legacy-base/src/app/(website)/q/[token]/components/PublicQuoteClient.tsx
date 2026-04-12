'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import {
    QuoteHeader,
    CustomerInfo,
    QuoteItemsTable,
    QuoteItemCards,
    PricingSummary,
    QuoteFooter
} from './QuoteContent';
import { QuoteActions } from './QuoteActions';
import SignatureSection from './SignatureSection';
import VariantSelector from './VariantSelector';
import CountdownTimer from './CountdownTimer';
import { formatDocTitle } from '@/lib/utils';

interface PublicQuoteClientProps {
    token: string;
    initialData: any;
}

export default function PublicQuoteClient({ token, initialData }: PublicQuoteClientProps) {
    const [data, setData] = useState(initialData);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        initialData.quote.selectedVariantId ||
        initialData.quote.variants?.find((v: any) => v.isRecommended)?.id ||
        initialData.quote.variants?.[0]?.id ||
        null
    );

    // Refresh data when signed
    useEffect(() => {
        const handleRefresh = async () => {
            const baseUrl = ''; // Client side fetch
            const res = await fetch(`/api/public/q/${token}`);
            if (res.ok) {
                const refreshed = await res.json();
                setData(refreshed);
            }
        };

        window.addEventListener('quote-signed', handleRefresh);
        return () => window.removeEventListener('quote-signed', handleRefresh);
    }, [token]);

    const { status, quote, company, signature } = data;
    const isSigned = status === 'signed';

    // Current active data (either selected variant or the main quote totals)
    const activeVariant = selectedVariantId ? quote.variants?.find((v: any) => v.id === selectedVariantId) : null;
    const displayItems = activeVariant ? [...quote.sharedItems, ...activeVariant.items] : quote.items;
    const displayPricing = activeVariant ? activeVariant.pricing : quote.pricing;

    return (
        <div className="w-full max-w-5xl">
            <QuoteActions token={token} />

            {quote.isExpired && !isSigned && (
                <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg p-4 mb-8 text-center font-bold shadow-sm">
                    ⚠️ 此報價已過有效期限，如仍有需求請聯繫我們
                </div>
            )}

            <div className="bg-white shadow-2xl rounded-sm p-3 md:p-[10mm] min-h-[297mm] flex flex-col">
                <QuoteHeader quote={quote} company={company} />

                <div className="text-center pt-[5px] pb-[17px]">
                    <h2 className="text-[26px] font-black tracking-[8px] font-serif" style={{ color: '#1B3A5C' }}>
                        {formatDocTitle(quote.name, '報價單')}
                    </h2>
                    <div 
                        className="text-[11px] font-bold tracking-[2px] opacity-60 uppercase mt-[-4px] font-inter" 
                        style={{ color: '#1B3A5C', fontFamily: 'var(--font-inter), Inter, sans-serif' }}
                    >
                        Security System Integration Proposal
                    </div>
                </div>

                <CustomerInfo customer={quote.customer} />

                {/* Variant Selector */}
                {quote.hasVariants && (
                    <div className="mb-10 no-print">
                        <VariantSelector
                            variants={quote.variants}
                            selectedVariantId={selectedVariantId}
                            onSelect={setSelectedVariantId}
                            isSigned={isSigned}
                        />
                    </div>
                )}

                <div className="mb-6 flex-1">
                    <QuoteItemsTable items={displayItems} />
                    <QuoteItemCards items={displayItems} />
                </div>

                {quote.discountExpiryAt && displayPricing.discountAmount > 0 && (
                    <div className="mb-6 flex justify-end no-print">
                        <CountdownTimer expiryDate={quote.discountExpiryAt} />
                    </div>
                )}

                <PricingSummary quote={quote} pricing={displayPricing} />

                <SignatureSection
                    token={token}
                    quoteId={quote.id}
                    quoteStatus={quote.status}
                    existingSignature={signature}
                    selectedVariantId={selectedVariantId}
                />

                <QuoteFooter company={company} />

                <div className="mt-auto pt-8 flex justify-center items-center gap-2 text-[10px] font-bold" style={{ color: '#CBD5E1' }}>
                    <div className="h-[1px] flex-1 bg-current opacity-20" />
                    <span>PAGE 01 / 01</span>
                    <div className="h-[1px] flex-1 bg-current opacity-20" />
                </div>
            </div>
        </div>
    );
}
