export type BreadcrumbItem = {
    label: string;
    href?: string;
};

export type BreadcrumbSchemaItem = {
    name: string;
    item: string;
};

export const HOME_BREADCRUMB: BreadcrumbItem = {
    label: '首頁',
    href: '/',
};

export function withHomeBreadcrumb(...items: Array<BreadcrumbItem | string>): BreadcrumbItem[] {
    return [
        HOME_BREADCRUMB,
        ...items.map((item) => (typeof item === 'string' ? { label: item } : item)),
    ];
}

function toAbsoluteUrl(origin: string, href: string) {
    if (/^https?:\/\//i.test(href)) return href;
    return `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
}

export function toBreadcrumbSchemaItems(
    items: BreadcrumbItem[],
    origin: string,
    currentPath?: string,
): BreadcrumbSchemaItem[] {
    return items.map((item, index) => {
        const fallbackHref = index === items.length - 1 ? currentPath : undefined;
        const resolvedHref = item.href || fallbackHref || currentPath || '/';

        return {
            name: item.label,
            item: toAbsoluteUrl(origin, resolvedHref),
        };
    });
}
