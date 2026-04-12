import { prisma } from '@/lib/prisma';

/**
 * Display names for top-level categories.
 */
const CATEGORY_DISPLAY_MAP: Record<string, string> = {
    '門禁': '門禁系統',
    '監視': '監視錄影',
    '電話': '電話總機',
    '網路': '網路設備',
    '其他': '其他設備',
};

/**
 * Get display name for a category. Falls back to the original name.
 */
export function getCategoryDisplayName(name: string): string {
    return CATEGORY_DISPLAY_MAP[name] || name;
}

/**
 * Look up a category by its seo_slug from the database.
 * Returns the category or null.
 */
export async function getCategoryBySlug(slug: string) {
    if (process.env.NEXT_PHASE === 'phase-production-build') return null;

    const selectFields = {
        id: true, name: true, parentId: true,
        seoSlug: true, seoTitle: true, seoDescription: true,
        showOnWebsite: true,
        parent: { select: { id: true, name: true, seoSlug: true } },
    } as const;

    // Try seoSlug first, then fall back to ID
    const bySlug = await prisma.productCategory.findFirst({
        where: { seoSlug: slug, showOnWebsite: true },
        select: selectFields,
    });
    if (bySlug) return bySlug;

    return prisma.productCategory.findFirst({
        where: { id: slug, showOnWebsite: true },
        select: selectFields,
    });
}

/**
 * Get the slug for a category. Uses DB seo_slug with ID fallback.
 */
export function getCategorySlugFromRecord(category: { seoSlug: string | null; id: string }): string {
    return category.seoSlug || category.id;
}
