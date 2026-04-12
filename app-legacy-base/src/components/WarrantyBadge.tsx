'use client';

import { adminCaseCopy } from '@/lib/admin-case-copy';
import { getWarrantyRemainingDays, getWarrantyStatus } from '@/lib/warranty';

interface WarrantyBadgeProps {
    quote: {
        status: string;
        warrantyStartDate: string | Date | null;
        warrantyExpiresAt: string | Date | null;
        warrantyMonths?: number | null;
    };
}

export default function WarrantyBadge({ quote }: WarrantyBadgeProps) {
    const status = getWarrantyStatus(quote);
    if (status === 'none') return null;

    const remaining = getWarrantyRemainingDays(quote);
    const copy = adminCaseCopy.warranty;

    if (status === 'no_warranty') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[10px] font-bold text-gray-500">
                {copy.none}
            </span>
        );
    }

    if (status === 'active') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                {copy.active}
                {copy.remainingDays(remaining)}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
            {copy.expired}
        </span>
    );
}
