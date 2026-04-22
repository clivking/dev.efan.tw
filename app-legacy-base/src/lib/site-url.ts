import { headers } from 'next/headers';

const DEFAULT_PUBLIC_ORIGIN = 'https://www.efan.tw';

export type SiteStage = 'www' | 'pre' | 'dev' | 'custom';

export interface SiteContext {
    host: string;
    origin: string;
    stage: SiteStage;
    isIndexable: boolean;
}

function getFallbackOrigin() {
    return process.env.NEXT_PUBLIC_APP_URL || DEFAULT_PUBLIC_ORIGIN;
}

export function getConfiguredSiteOrigin() {
    return getFallbackOrigin();
}

function normalizeHost(rawHost: string | null | undefined) {
    const fallbackHost = new URL(getFallbackOrigin()).host;
    const host = (rawHost || fallbackHost)
        .split(',')[0]
        .trim()
        .toLowerCase();

    return host.replace(/:\d+$/, '');
}

function normalizeOriginHost(rawHost: string | null | undefined) {
    const fallbackHost = new URL(getFallbackOrigin()).host;
    return (rawHost || fallbackHost)
        .split(',')[0]
        .trim()
        .toLowerCase();
}

function normalizeProtocol(rawProtocol: string | null | undefined) {
    const protocol = (rawProtocol || 'https').trim().toLowerCase();
    return protocol === 'http' || protocol === 'https' ? protocol : 'https';
}

export function getSiteStage(host: string): SiteStage {
    if (host === 'www.efan.tw') return 'www';
    if (host === 'pre.efan.tw') return 'pre';
    if (host === 'dev.efan.tw') return 'dev';
    return 'custom';
}

export function isIndexableHost(host: string) {
    return getSiteStage(host) === 'www';
}

export function buildSiteContext(hostLike?: string | null, protocolLike?: string | null): SiteContext {
    const host = normalizeHost(hostLike);
    const stage = getSiteStage(host);
    const protocol = stage === 'custom' ? normalizeProtocol(protocolLike) : 'https';
    const originHost = stage === 'custom' ? normalizeOriginHost(hostLike) : host;

    return {
        host,
        origin: `${protocol}://${originHost}`,
        stage,
        isIndexable: isIndexableHost(host),
    };
}

export async function getRequestSiteContext(): Promise<SiteContext> {
    const headerStore = await headers();
    return buildSiteContext(
        headerStore.get('x-forwarded-host') || headerStore.get('host'),
        headerStore.get('x-forwarded-proto')
    );
}

export function getSiteContextFromHeaders(headerStore: Headers): SiteContext {
    return buildSiteContext(
        headerStore.get('x-forwarded-host') || headerStore.get('host'),
        headerStore.get('x-forwarded-proto')
    );
}

export function getSiteContextFromRequest(request: Request): SiteContext {
    return getSiteContextFromHeaders(request.headers);
}

export function getOriginFromRequest(request: Request): string {
    return getSiteContextFromRequest(request).origin;
}

export function toAbsoluteUrl(pathOrUrl: string, origin = getFallbackOrigin()): string {
    if (!pathOrUrl) return origin;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
