import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestSiteContext } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function GET() {
    const site = await getRequestSiteContext();
    const baseUrl = site.origin;
    const now = new Date().toISOString();

    if (!site.isIndexable) {
        const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

        return new NextResponse(emptyXml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    }

    // Static pages
    const staticPages = [
        { loc: '', changefreq: 'weekly', priority: '1.0' },
        { loc: '/about', changefreq: 'monthly', priority: '0.8' },
        { loc: '/about/clients', changefreq: 'monthly', priority: '0.9' },
        { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
        { loc: '/services/access-control', changefreq: 'monthly', priority: '0.8' },
        { loc: '/services/cctv', changefreq: 'monthly', priority: '0.8' },
        { loc: '/services/phone-system', changefreq: 'monthly', priority: '0.8' },
        { loc: '/services/attendance', changefreq: 'monthly', priority: '0.7' },
        { loc: '/services/integration', changefreq: 'monthly', priority: '0.7' },
        { loc: '/products', changefreq: 'weekly', priority: '0.9' },
        { loc: '/tools', changefreq: 'monthly', priority: '0.7' },
        { loc: '/tools/cctv-storage-calculator', changefreq: 'weekly', priority: '0.8' },
        { loc: '/support/downloads', changefreq: 'monthly', priority: '0.6' },
        { loc: '/quote-request', changefreq: 'monthly', priority: '0.8' },
    ];

    // Dynamic pages from database
    let categories: { seoSlug: string | null; updatedAt: Date }[] = [];
    let products: { id: string; seoSlug: string | null; updatedAt: Date; name: string }[] = [];
    let guides: { slug: string; updatedAt: Date }[] = [];
    let productImageMap = new Map<string, string[]>();
    try {
        [categories, products, guides] = await Promise.all([
            prisma.productCategory.findMany({
                where: { seoSlug: { not: null } },
                select: { seoSlug: true, updatedAt: true },
            }),
            prisma.product.findMany({
                where: { isDeleted: false, showOnWebsite: true, seoSlug: { not: null } },
                select: { id: true, seoSlug: true, updatedAt: true, name: true },
            }),
            prisma.guideArticle.findMany({
                where: { isPublished: true },
                select: { slug: true, updatedAt: true },
            }),
        ]);

        if (products.length > 0) {
            const productIds = products.map(p => p.id);
            const uploadedImages = await prisma.uploadedFile.findMany({
                where: {
                    entityType: 'product',
                    entityId: { in: productIds },
                    mimetype: { startsWith: 'image/' },
                },
                select: { entityId: true, filepath: true },
                orderBy: { sortOrder: 'asc' },
                take: productIds.length * 5,
            });
            for (const img of uploadedImages) {
                if (!img.entityId) continue;
                const existing = productImageMap.get(img.entityId) ?? [];
                if (existing.length < 5) {
                    existing.push(img.filepath);
                    productImageMap.set(img.entityId, existing);
                }
            }
        }
    } catch (e) {
        console.warn('[sitemap] DB query failed:', e);
    }

    function toAbsoluteUrl(path: string) {
        if (/^https?:\/\//i.test(path)) return path;
        return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    // Build XML
    const urls = [
        ...staticPages.map(p => `
  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
        ...categories.map(c => `
  <url>
    <loc>${baseUrl}/products/category/${c.seoSlug}</loc>
    <lastmod>${c.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
        ...products.map(p => {
            const imgs = productImageMap.get(p.id) ?? [];
            const imageEntries = imgs
                .map(fp => `    <image:image>\n      <image:loc>${toAbsoluteUrl(fp)}</image:loc>\n      <image:title>${p.name}</image:title>\n    </image:image>`)
                .join('\n');
            return `
  <url>
    <loc>${baseUrl}/products/${p.seoSlug}</loc>
    <lastmod>${p.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${imageEntries}
  </url>`;
        }),
        ...guides.map(g => `
  <url>
    <loc>${baseUrl}/guides/${g.slug}</loc>
    <lastmod>${g.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.join('')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
