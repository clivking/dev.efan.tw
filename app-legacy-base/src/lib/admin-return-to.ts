import type { ReadonlyURLSearchParams } from 'next/navigation';

type SearchParamsLike = URLSearchParams | ReadonlyURLSearchParams;

export function buildReturnTo(pathname: string, searchParams: SearchParamsLike) {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function withReturnTo(href: string, returnTo?: string | null) {
    if (!returnTo) return href;

    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

export function sanitizeReturnTo(returnTo?: string | null, fallback: string = '/admin/quotes') {
    if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
        return fallback;
    }

    return returnTo;
}
