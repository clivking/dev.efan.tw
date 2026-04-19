export function shouldBypassImageOptimization(src: string | null | undefined) {
    if (!src) return false;

    return /^(\/api\/uploads\/|\/uploads\/|https?:\/\/[^/]+\/api\/uploads\/|https?:\/\/[^/]+\/uploads\/)/i.test(src);
}

function encodePathname(pathname: string) {
    return pathname
        .split('/')
        .map((segment, index) => (index === 0 ? segment : encodeURIComponent(decodeURIComponent(segment))))
        .join('/');
}

export function normalizeImageSrc(src: string | null | undefined) {
    if (!src) return src ?? '';

    const isAbsolute = /^https?:\/\//i.test(src);

    if (isAbsolute) {
        const url = new URL(src);
        url.pathname = encodePathname(url.pathname);
        return url.toString();
    }

    const [pathWithMaybeQuery, hash = ''] = src.split('#');
    const [pathname, query = ''] = pathWithMaybeQuery.split('?');
    const params = new URLSearchParams(query);

    const normalizedPath = encodePathname(pathname);
    const nextQuery = params.toString();
    return `${normalizedPath}${nextQuery ? `?${nextQuery}` : ''}${hash ? `#${hash}` : ''}`;
}
