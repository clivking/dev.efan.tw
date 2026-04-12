/**
 * Warranty status calculation helpers.
 * warrantyStatus is computed on every read — never stored in DB.
 */

export type WarrantyStatus = 'none' | 'active' | 'expired' | 'no_warranty';

/** Only these statuses can display a warranty badge */
export const WARRANTY_ELIGIBLE_STATUSES = ['completed', 'paid'] as const;

/**
 * Calculate warranty status from quote data.
 * Does NOT store in DB — computed on every read.
 */
export function getWarrantyStatus(quote: {
    status: string;
    warrantyStartDate: Date | string | null;
    warrantyExpiresAt: Date | string | null;
    warrantyMonths?: number | null;
}): WarrantyStatus {
    // Only completed / paid show warranty badge
    // (This also implicitly excludes 'closed' and all earlier statuses)
    if (!WARRANTY_ELIGIBLE_STATUSES.includes(quote.status as any)) {
        return 'none';
    }

    // warrantyMonths === 0 means explicitly no warranty (e.g. equipment relocation)
    if (quote.warrantyMonths === 0) {
        return 'no_warranty';
    }

    if (!quote.warrantyStartDate || !quote.warrantyExpiresAt) {
        return 'none';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiresAt = new Date(quote.warrantyExpiresAt);
    expiresAt.setHours(0, 0, 0, 0);

    if (today >= expiresAt) {
        return 'expired';
    }

    return 'active';
}

/**
 * Calculate remaining warranty days.
 * Returns null if not applicable, 0 if expired, positive number if active.
 */
export function getWarrantyRemainingDays(quote: {
    status: string;
    warrantyStartDate: Date | string | null;
    warrantyExpiresAt: Date | string | null;
    warrantyMonths?: number | null;
}): number | null {
    const ws = getWarrantyStatus(quote);
    if (ws === 'none' || ws === 'no_warranty') return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiresAt = new Date(quote.warrantyExpiresAt!);
    expiresAt.setHours(0, 0, 0, 0);

    const diff = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}
