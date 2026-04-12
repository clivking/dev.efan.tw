import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Slug-to-path mapping for revalidation
export const SLUG_TO_PATH: Record<string, string> = {
    'home': '/',
    'service-access-control': '/services/access-control',
    'service-cctv': '/services/cctv',
    'service-phone-system': '/services/phone-system',
    'service-attendance': '/services/attendance',
    'service-integration': '/services/integration',
    'about': '/about',
    'contact': '/contact',
};

/** Get a single page by slug (cached 1 hour, tag: page-content) */
export const getPageContent = unstable_cache(
    async (slug: string) => {
        const page = await prisma.page.findUnique({
            where: { slug, isPublished: true },
        });
        return page;
    },
    ['page-content'],
    { revalidate: 3600, tags: ['page-content'] }
);

/** Get page content with build-phase fallback */
export async function getPage(slug: string) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return null;
    }
    return getPageContent(slug);
}
