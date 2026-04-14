import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import sanitizeHtml from 'sanitize-html';
import JsonLdScript from '@/components/common/JsonLdScript';
import ProductBadges from '@/components/products/ProductBadges';
import ProductTabs from '@/components/products/ProductTabs';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { PRODUCT_PAGE_COPY } from '@/lib/product-page-copy';
import { prisma } from '@/lib/prisma';
import { getProductMainImage, getProductMainImages, stripHtml } from '@/lib/product-helpers';
import { getRequestSiteContext, toAbsoluteUrl } from '@/lib/site-url';
import { normalizeImageSrc, shouldBypassImageOptimization } from '@/lib/image-paths';
import { buildBreadcrumbSchema, buildFaqSchema, buildProductSchema } from '@/lib/structured-data';
import { renderContent } from '@/lib/tiptap';
import ProductDetailClient from './ProductDetailClient';
import ProductImageGallery from './ProductImageGallery';

export const revalidate = 3600;

interface Props {
    params: Promise<{ slug: string }>;
}

type ProductRecord = Awaited<ReturnType<typeof getProductBySlug>>;

type JsonReview = {
    author?: string;
    rating?: number;
    body?: string;
    date?: string;
};

type VisibleProduct = NonNullable<ProductRecord>;

async function getProductBySlug(slug: string) {
    if (process.env.NEXT_PHASE === 'phase-production-build') return null;

    return prisma.product.findFirst({
        where: { seoSlug: slug, isDeleted: false, showOnWebsite: true },
        select: {
            id: true,
            name: true,
            brand: true,
            model: true,
            description: true,
            websiteDescription: true,
            unit: true,
            type: true,
            categoryId: true,
            seoSlug: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            targetKeyword: true,
            secondaryKeywords: true,
            searchIntent: true,
            sourceUrl: true,
            sourceCheckedAt: true,
            contentStatus: true,
            needsRevalidation: true,
            content: true,
            specifications: true,
            videoUrl: true,
            faqs: true,
            useCases: true,
            bestFor: true,
            notFor: true,
            compatibility: true,
            installationNotes: true,
            maintenanceTips: true,
            comparisonNotes: true,
            imageAlt: true,
            imageCaption: true,
            seoRatingValue: true,
            seoRatingCount: true,
            seoReviews: true,
            isAI: true,
            isHot: true,
            isNew: true,
            sellingPrice: true,
            category: { select: { id: true, name: true, seoSlug: true } },
        },
    });
}

async function getRelated(categoryId: string, excludeId: string) {
    if (process.env.NEXT_PHASE === 'phase-production-build') return [];

    return prisma.product.findMany({
        where: {
            categoryId,
            id: { not: excludeId },
            isDeleted: false,
            isHiddenItem: false,
            showOnWebsite: true,
            seoSlug: { not: null },
        },
        select: {
            id: true,
            name: true,
            brand: true,
            model: true,
            description: true,
            seoSlug: true,
            category: { select: { id: true, name: true, seoSlug: true } },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
    });
}

async function getWebsiteImages(productId: string) {
    return prisma.uploadedFile.findMany({
        where: { entityType: 'product_website', entityId: productId },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, filepath: true, filename: true, title: true, description: true },
    });
}

async function getContentImages(productId: string) {
    return prisma.uploadedFile.findMany({
        where: { entityType: 'product_content_image', entityId: productId },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, filepath: true, filename: true, displayMode: true },
    });
}

async function getDocuments(productId: string) {
    return prisma.uploadedFile.findMany({
        where: { entityType: 'product_document', entityId: productId },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            filepath: true,
            filename: true,
            mimetype: true,
            size: true,
            title: true,
            description: true,
            docType: true,
        },
    });
}

function shuffle<T>(items: T[]): T[] {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}

function getYouTubeId(url: string) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return match ? match[1] : null;
}

function normalizeProductCode(value: string | null | undefined) {
    return (value || '').trim().replace(/\s+/g, '');
}

function getSummaryItems(value: string | null | undefined) {
    if (!value) return [];

    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li)>/gi, '\n')
        .split(/\r?\n/)
        .map((item) => stripHtml(item).replace(/\u00a0/g, ' ').trim())
        .filter(Boolean);
}

function isValidStructuredDataCode(value: string | null | undefined) {
    const code = normalizeProductCode(value);
    if (!code) return false;
    if (code.length < 3 || code.length > 64) return false;
    if (!/[a-z]/i.test(code) || !/\d/.test(code)) return false;
    if (!/^[a-z0-9][a-z0-9._/-]*$/i.test(code)) return false;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code)) return false;
    return true;
}

function formatFileSize(bytes: number | null) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSourceDate(value: Date | string | null | undefined) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

function getIntentLabel(intent: string | null | undefined) {
    switch (intent) {
        case 'informational':
            return PRODUCT_PAGE_COPY.searchIntentLabels.informational;
        case 'transactional':
            return PRODUCT_PAGE_COPY.searchIntentLabels.transactional;
        case 'commercial':
        default:
            return PRODUCT_PAGE_COPY.searchIntentLabels.commercial;
    }
}

function getIntentDescription(intent: string | null | undefined) {
    switch (intent) {
        case 'informational':
            return PRODUCT_PAGE_COPY.searchIntentDescriptions.informational;
        case 'transactional':
            return PRODUCT_PAGE_COPY.searchIntentDescriptions.transactional;
        case 'commercial':
        default:
            return PRODUCT_PAGE_COPY.searchIntentDescriptions.commercial;
    }
}

function getContentStatusLabel(status: string | null | undefined) {
    switch (status) {
        case 'reviewed':
            return PRODUCT_PAGE_COPY.contentStatusLabels.reviewed;
        case 'published':
            return PRODUCT_PAGE_COPY.contentStatusLabels.published;
        case 'stale':
            return PRODUCT_PAGE_COPY.contentStatusLabels.stale;
        case 'draft':
        default:
            return PRODUCT_PAGE_COPY.contentStatusLabels.draft;
    }
}

function getProductSummary(product: VisibleProduct, specs: Array<{ key: string; value: string }>) {
    const parts = [
        stripHtml(product.websiteDescription),
        product.description,
        ...specs.map((item) => `${item.key}：${item.value}`),
    ]
        .filter((item): item is string => Boolean(item && item.trim()))
        .map((item) => item.trim());

    return parts.join(' ').slice(0, 4999);
}


function getProductSchemaDescription(product: VisibleProduct, summaryBullets: string[]) {
    const summary = getProductSummary(product, []);
    if (summaryBullets.length === 0) return summary;
    return `${summary} 重點包括：${summaryBullets.join('、')}`.slice(0, 4999);
}

function flattenSpecificationProperties(specifications: unknown[]) {
    const properties: Array<{ '@type': 'PropertyValue'; name: string; value: string }> = [];

    for (const group of specifications) {
        const items = Array.isArray((group as { items?: unknown[] })?.items) ? (group as { items: unknown[] }).items : [];
        for (const item of items) {
            const row = item as { key?: unknown; value?: unknown };
            const name = typeof row.key === 'string' ? row.key.trim() : '';
            const rawValue = typeof row.value === 'string' ? row.value : String(row.value ?? '');
            const value = rawValue.trim();
            if (!name || !value) continue;
            properties.push({ '@type': 'PropertyValue', name, value });
        }
    }

    return properties;
}

function getVisibleSpecs(specifications: unknown[]) {
    const importancePatterns = [
        /\u8996\u89d2|wide-angle|viewing angle/i,
        /\u651d\u5f71\u6a5f|camera/i,
        /poe|\u4f9b\u96fb|power/i,
        /\u9632\u8b77|ip\d+/i,
        /\u5354\u5b9a|\u6574\u5408|sip|onvif/i,
        /\u5361\u7247|rfid|nfc/i,
        /\u7e7c\u96fb\u5668|relay/i,
    ];

    const items = specifications
        .flatMap((group) => (Array.isArray((group as { items?: unknown[] })?.items) ? (group as { items: unknown[] }).items : []))
        .filter((item) => Boolean((item as { value?: unknown })?.value))
        .map((item) => {
            const row = item as { key: string; value: string };
            return {
                key: row.key,
                value: row.value,
            };
        })
        .filter((item) => item.key && item.value);

    const scored = items.map((item, index) => ({
        item,
        score: importancePatterns.findIndex((pattern) => pattern.test(item.key || '')),
        index,
    }));

    return scored
        .sort((a, b) => {
            const aScore = a.score === -1 ? 999 : a.score;
            const bScore = b.score === -1 ? 999 : b.score;
            if (aScore !== bScore) return aScore - bScore;
            return a.index - b.index;
        })
        .map(({ item }) => item)
        .slice(0, 8);
}

function normalizeReviews(reviews: unknown): JsonReview[] {
    if (!Array.isArray(reviews)) return [];
    return reviews.filter((review): review is JsonReview => {
        if (!review || typeof review !== 'object') return false;
        const row = review as JsonReview;
        return Boolean(row.author && row.body && row.rating);
    });
}

function normalizeStringList(value: unknown) {
    return Array.isArray(value)
        ? value
              .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
              .map((item) => item.trim())
              .filter(Boolean)
        : [];
}

function sanitizeRichContent(value: unknown) {
    if (!value) return '';
    if (typeof value === 'string') {
        return sanitizeHtml(value, {
            allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'a', 'hr', 'pre', 'code'],
            allowedAttributes: {
                a: ['href', 'target', 'rel', 'class'],
                img: ['src', 'alt', 'width', 'height', 'class'],
                p: ['class'],
            },
        });
    }

    return renderContent(value);
}

async function findBestSlugMatch(slug: string) {
    const cleanSlug = slug.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (cleanSlug.length < 3) return null;

    const candidates = await prisma.product.findMany({
        where: { isDeleted: false, showOnWebsite: true, seoSlug: { not: null } },
        select: { seoSlug: true },
    });

    let bestMatch: string | null = null;
    let highestScore = 0;

    for (const candidate of candidates) {
        const candidateSlug = candidate.seoSlug;
        if (!candidateSlug) continue;

        const candidateClean = candidateSlug.replace(/[^a-z0-9]/gi, '').toLowerCase();
        if (candidateClean.includes(cleanSlug) || cleanSlug.includes(candidateClean)) {
            return candidateSlug;
        }

        let matches = 0;
        let remainder = candidateClean;
        for (const char of cleanSlug) {
            const index = remainder.indexOf(char);
            if (index === -1) continue;
            matches += 1;
            remainder = remainder.slice(0, index) + remainder.slice(index + 1);
        }

        const baseScore = (matches * 2) / (cleanSlug.length + candidateClean.length);
        const prefixBonus = cleanSlug.slice(0, 3) === candidateClean.slice(0, 3) ? 0.2 : 0;
        const finalScore = baseScore + prefixBonus;

        if (finalScore > highestScore && finalScore >= 0.75) {
            highestScore = finalScore;
            bestMatch = candidateSlug;
        }
    }

    return bestMatch;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return {};

    const company = await getCompanyInfo();
    const site = await getRequestSiteContext();
    const title = product.seoTitle || `${product.brand || ''} ${product.model || ''} ${product.name}`.trim();
    const description =
        product.seoDescription ||
        stripHtml(product.websiteDescription) ||
        product.description?.slice(0, 155) ||
        `${product.name} ${PRODUCT_PAGE_COPY.metadataFallbackDescription}`;
    const canonical = `${site.origin}/products/${product.seoSlug}`;
    const ogImage = await getProductMainImage(product.id);
    const absoluteOgImage = ogImage ? toAbsoluteUrl(ogImage, site.origin) : null;

    return {
        ...buildContentMetadata({
            site,
            pathname: `/products/${product.seoSlug}`,
            title,
            description,
            siteName: company.name,
            ogImage: absoluteOgImage,
            type: 'website',
        }),
        keywords: product.seoKeywords || undefined,
    };
}

export default async function ProductDetailPage({ params }: Props) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        const matchedSlug = await findBestSlugMatch(slug);
        if (matchedSlug) permanentRedirect(`/products/${matchedSlug}`);
        notFound();
    }

    const company = await getCompanyInfo();
    const site = await getRequestSiteContext();
    const [related, websiteImages, contentImages, documents] = await Promise.all([
        getRelated(product.categoryId, product.id),
        getWebsiteImages(product.id),
        getContentImages(product.id),
        getDocuments(product.id),
    ]);

    const categorySlug = product.category?.seoSlug || product.category?.id || '';
    const mainImage = websiteImages.length > 0 ? websiteImages[0].filepath : null;
    const galleryImages = websiteImages.map((image) => normalizeImageSrc(image.filepath));
    const absoluteImages = websiteImages.map((image) => toAbsoluteUrl(normalizeImageSrc(image.filepath), site.origin));
    const absoluteMainImage = mainImage ? toAbsoluteUrl(mainImage, site.origin) : null;
    const imageStoryItems = websiteImages
        .map((image, index) => ({
            id: image.id,
            src: image.filepath,
            title:
                image.title?.trim() ||
                (index === 0
                    ? `${product.name} ${PRODUCT_PAGE_COPY.imageCoverSuffix}`
                    : `${product.name} ${PRODUCT_PAGE_COPY.imageGallerySuffix} ${index + 1}`),
            description: image.description?.trim() || '',
        }))
        .filter((image) => galleryImages.length > 1 || image.description);
    const relatedImageMap = await getProductMainImages(related.map((item) => item.id));
    const relatedWithSlug = shuffle(
        related.map((item) => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            model: item.model,
            description: item.description,
            imageUrl: relatedImageMap.get(item.id) ?? null,
            slug: item.seoSlug!,
            category: item.category
                ? { id: item.category.id, name: item.category.name, slug: item.category.seoSlug || item.category.id }
                : null,
        })),
    );

    const faqsArray = Array.isArray(product.faqs) ? product.faqs : [];
    const specsArray = Array.isArray(product.specifications) ? product.specifications : [];
    const useCases = normalizeStringList(product.useCases);
    const bestFor = normalizeStringList(product.bestFor);
    const notFor = normalizeStringList(product.notFor);
    const compatibility = normalizeStringList(product.compatibility);
    const installationNotes = normalizeStringList(product.installationNotes);
    const maintenanceTips = normalizeStringList(product.maintenanceTips);
    const keywordCluster = normalizeStringList(product.secondaryKeywords);
    const reviewsArray = normalizeReviews(product.seoReviews);
    const summaryItems = getSummaryItems(product.websiteDescription);
    const summaryBullets = [...useCases, ...bestFor, ...compatibility].filter(Boolean).slice(0, 5);
    const propertyValues = flattenSpecificationProperties(specsArray);
    const quickSpecItems = getVisibleSpecs(specsArray);
    const structuredProductCode = isValidStructuredDataCode(product.model) ? normalizeProductCode(product.model) : null;
    const videoId = product.videoUrl ? getYouTubeId(product.videoUrl) : null;
    const schemaDescription = getProductSchemaDescription(product, summaryBullets);
    const contentHtml = sanitizeRichContent(product.content);
    const targetKeyword = product.targetKeyword?.trim() || '';
    const comparisonNotes = product.comparisonNotes;
    const sourceCheckedLabel = formatSourceDate(product.sourceCheckedAt);
    const contentStatusLabel = getContentStatusLabel(product.contentStatus);
    const searchIntentLabel = getIntentLabel(product.searchIntent);
    const searchIntentDescription = getIntentDescription(product.searchIntent);
    const heroStatement =
        product.description ||
        stripHtml(product.websiteDescription) ||
        `${product.name}${PRODUCT_PAGE_COPY.heroStatementFallback}`;

    const productJsonLd = buildProductSchema({
        url: `${site.origin}/products/${product.seoSlug}`,
        name: product.name,
        image: absoluteImages.length > 0 ? absoluteImages : [absoluteMainImage].filter(Boolean) as string[],
        description: schemaDescription,
        sku: structuredProductCode,
        mpn: structuredProductCode,
        category: product.category?.name,
        brandName: product.brand || company.name,
        additionalProperty: propertyValues,
        keywords: targetKeyword ? [targetKeyword, ...keywordCluster].join(', ') : null,
        offers:
            Number(product.sellingPrice) > 0
                ? {
                      priceCurrency: 'TWD',
                      price: Number(product.sellingPrice),
                      priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
                      availability: 'https://schema.org/InStock',
                      itemCondition: 'https://schema.org/NewCondition',
                      sellerName: company.name,
                  }
                : null,
    });

    const faqJsonLd = buildFaqSchema(
        faqsArray
            .map((faq) => {
                const row = faq as { question?: string; answer?: string };
                return row.question && row.answer
                    ? {
                          question: row.question,
                          answer: row.answer,
                      }
                    : null;
            })
            .filter(Boolean) as Array<{ question: string; answer: string }>,
    );

    const breadcrumbJsonLd = buildBreadcrumbSchema([
        { name: PRODUCT_PAGE_COPY.breadcrumbHome, item: site.origin },
        { name: PRODUCT_PAGE_COPY.breadcrumbProducts, item: `${site.origin}/products` },
        ...(product.category
            ? [{ name: product.category.name, item: `${site.origin}/products/category/${categorySlug}` }]
            : []),
        { name: product.name, item: `${site.origin}/products/${product.seoSlug}` },
    ]);

    const tabs: Array<{ key: string; label: string; content: ReactNode }> = [];

    const hasSelectionGuide = useCases.length > 0 || bestFor.length > 0 || notFor.length > 0;
    const hasIntroSupplement =
        hasSelectionGuide ||
        comparisonNotes ||
        quickSpecItems.length > 0 ||
        faqsArray.length > 0;

    if (contentHtml || hasIntroSupplement) {
        tabs.push({
            key: 'intro',
            label: PRODUCT_PAGE_COPY.tabIntro,
            content: (
                <div className="space-y-10">
                    {contentHtml ? <div className="product-content" dangerouslySetInnerHTML={{ __html: contentHtml }} /> : null}

                    {hasIntroSupplement ? (
                        <div className="space-y-8 border-t border-gray-100 pt-8">
                            {hasSelectionGuide ? (
                                <div className="space-y-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{PRODUCT_PAGE_COPY.selectionGuideEyebrow}</div>
                                            <h3 className="mt-2 text-2xl font-black text-gray-900">{PRODUCT_PAGE_COPY.selectionGuideTitle}</h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {useCases.length > 0 ? (
                                            <div className="rounded-[24px] bg-gray-50/80 px-5 py-5">
                                                <div className="mb-3 text-sm font-black text-gray-900">{PRODUCT_PAGE_COPY.useCasesLabel}</div>
                                                <ul className="space-y-2 text-sm leading-7 text-gray-600">
                                                    {useCases.map((item, index) => (
                                                        <li key={`${item}-${index}`}>• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                        {bestFor.length > 0 ? (
                                            <div className="rounded-[24px] bg-emerald-50/70 px-5 py-5">
                                                <div className="mb-3 text-sm font-black text-gray-900">{PRODUCT_PAGE_COPY.bestForLabel}</div>
                                                <ul className="space-y-2 text-sm leading-7 text-gray-600">
                                                    {bestFor.map((item, index) => (
                                                        <li key={`${item}-${index}`}>• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                        {notFor.length > 0 ? (
                                            <div className="rounded-[24px] bg-amber-50/75 px-5 py-5">
                                                <div className="mb-3 text-sm font-black text-gray-900">{PRODUCT_PAGE_COPY.notForLabel}</div>
                                                <ul className="space-y-2 text-sm leading-7 text-gray-600">
                                                    {notFor.map((item, index) => (
                                                        <li key={`${item}-${index}`}>• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            {comparisonNotes ? (
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-gray-900">{PRODUCT_PAGE_COPY.comparisonTitle}</h3>
                                    <div className="whitespace-pre-line text-base leading-8 text-gray-600">{comparisonNotes}</div>
                                </div>
                            ) : null}

                            {quickSpecItems.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-black text-gray-900">{PRODUCT_PAGE_COPY.quickSpecsTitle}</h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {quickSpecItems.map((item, index) => (
                                            <div key={`${item.key}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-4">
                                                <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{item.key}</div>
                                                <div className="mt-2 text-sm font-bold leading-6 text-gray-800">{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            ),
        });
    }

    if (compatibility.length > 0 || installationNotes.length > 0 || maintenanceTips.length > 0 || comparisonNotes) {
        tabs.push({
            key: 'usage',
            label: PRODUCT_PAGE_COPY.tabUsage,
            content: (
                <div className="space-y-6">
                    {compatibility.length > 0 ? (
                        <div className="flex h-full flex-col">
                            <h3 className="mb-3 text-lg font-bold text-gray-800">{PRODUCT_PAGE_COPY.compatibilityTitle}</h3>
                            <ul className="space-y-2 text-gray-600">
                                {compatibility.map((item, index) => (
                                    <li key={`${item}-${index}`}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {installationNotes.length > 0 ? (
                        <div>
                            <h3 className="mb-3 text-lg font-bold text-gray-800">{PRODUCT_PAGE_COPY.installationTitle}</h3>
                            <ul className="space-y-2 text-gray-600">
                                {installationNotes.map((item, index) => (
                                    <li key={`${item}-${index}`}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {maintenanceTips.length > 0 ? (
                        <div>
                            <h3 className="mb-3 text-lg font-bold text-gray-800">{PRODUCT_PAGE_COPY.maintenanceTitle}</h3>
                            <ul className="space-y-2 text-gray-600">
                                {maintenanceTips.map((item, index) => (
                                    <li key={`${item}-${index}`}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {comparisonNotes ? (
                        <div>
                            <h3 className="mb-3 text-lg font-bold text-gray-800">{PRODUCT_PAGE_COPY.comparisonTitle}</h3>
                            <div className="whitespace-pre-line text-gray-600">{comparisonNotes}</div>
                        </div>
                    ) : null}
                </div>
            ),
        });
    }

    if (specsArray.length > 0) {
        tabs.push({
            key: 'specs',
            label: PRODUCT_PAGE_COPY.tabSpecs,
            content: (
                <div className="space-y-6">
                    {specsArray.map((group, groupIndex) => {
                        const row = group as { group?: string; items?: Array<{ key?: string; value?: string }> };
                        const items = Array.isArray(row.items) ? row.items.filter((item) => item?.value) : [];
                        if (items.length === 0) return null;

                        return (
                            <div key={`${row.group || 'spec-group'}-${groupIndex}`}>
                                <h3 className="mb-3 text-lg font-bold text-gray-800">{row.group || `${PRODUCT_PAGE_COPY.specGroupFallback} ${groupIndex + 1}`}</h3>
                                <table className="w-full">
                                    <tbody>
                                        {items.map((item, itemIndex) => (
                                            <tr key={`${item.key || 'spec-item'}-${itemIndex}`} className={itemIndex % 2 === 0 ? 'bg-gray-50' : ''}>
                                                <td className="w-1/3 px-4 py-3 font-bold text-gray-700">{item.key}</td>
                                                <td className="px-4 py-3 text-gray-600">{item.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            ),
        });
    }

    if (faqsArray.length > 0) {
        tabs.push({
            key: 'faq',
            label: PRODUCT_PAGE_COPY.tabFaq,
            content: (
                <div className="space-y-4">
                    {faqsArray.map((faq, index) => {
                        const row = faq as { question?: string; answer?: string };
                        return (
                            <details key={`${row.question || 'faq'}-${index}`} className="group overflow-hidden rounded-2xl bg-gray-50" open>
                                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-bold text-gray-800 transition-colors hover:bg-white">
                                    <span>Q: {row.question}</span>
                                    <span className="text-gray-400 transition-transform group-open:rotate-180">+</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-600">{row.answer}</div>
                            </details>
                        );
                    })}
                </div>
            ),
        });
    }

    if (videoId) {
        tabs.push({
            key: 'video',
            label: PRODUCT_PAGE_COPY.tabVideo,
            content: (
                <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`${product.name} ${PRODUCT_PAGE_COPY.videoTitleSuffix}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="h-full w-full"
                    />
                </div>
            ),
        });
    }

    if (documents.length > 0) {
        const docTypes: Record<string, string> = PRODUCT_PAGE_COPY.docTypes;

        tabs.push({
            key: 'docs',
            label: PRODUCT_PAGE_COPY.tabDocs,
            content: (
                <div className="space-y-3">
                    {documents.map((doc) => {
                        const isPdf = doc.mimetype?.includes('pdf');
                        return (
                            <a
                                key={doc.id}
                                href={doc.filepath}
                                target={isPdf ? '_blank' : undefined}
                                download={!isPdf || undefined}
                                rel={isPdf ? 'noopener noreferrer' : undefined}
                                className="group flex items-center gap-4 rounded-2xl border border-transparent bg-gray-50 p-4 transition-all hover:border-gray-100 hover:bg-white hover:shadow-lg"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-white text-sm font-black text-gray-700 shadow-sm transition-transform group-hover:scale-110">
                                    {isPdf ? 'PDF' : '檔案'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-bold text-gray-800">{doc.title || doc.filename}</div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                        {doc.docType ? (
                                            <span className="rounded-lg border border-gray-100 bg-white px-2 py-0.5 font-bold">
                                                {docTypes[doc.docType] || doc.docType}
                                            </span>
                                        ) : null}
                                        {doc.size ? <span>{formatFileSize(doc.size)}</span> : null}
                                    </div>
                                    {doc.description ? <p className="mt-2 text-xs text-gray-500">{doc.description}</p> : null}
                                </div>
                                <span className="text-sm font-bold text-efan-primary opacity-0 transition-opacity group-hover:opacity-100">
                                    {isPdf ? '開啟 PDF' : '下載檔案'}
                                </span>
                            </a>
                        );
                    })}
                </div>
            ),
        });
    }

    return (
        <div className="flex w-full flex-col">
            <JsonLdScript data={productJsonLd} />
            <JsonLdScript data={breadcrumbJsonLd} />
            <JsonLdScript data={faqJsonLd} />

            <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#1d4ed8_0%,#2563eb_28%,#1f5fcf_48%,#103a83_72%,#0f172a_100%)] py-10 text-white sm:py-14">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(56,189,248,0.18))]" />
                    <div className="absolute -left-16 top-24 h-40 w-40 rounded-full bg-cyan-300/12 blur-3xl" />
                    <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-sky-300/12 blur-3xl" />
                    <div className="absolute left-[6%] top-[58%] grid grid-cols-4 gap-3 opacity-20">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <span key={`hero-dot-left-${index}`} className="h-2.5 w-2.5 rounded-full bg-cyan-200" />
                        ))}
                    </div>
                    <div className="absolute right-[8%] top-[22%] grid grid-cols-4 gap-3 opacity-20">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <span key={`hero-dot-right-${index}`} className="h-2.5 w-2.5 rounded-full bg-sky-100" />
                        ))}
                    </div>
                    <div className="absolute bottom-[-9%] right-[6%] text-[clamp(7rem,22vw,18rem)] font-black uppercase tracking-[-0.08em] text-white/6">
                        {product.brand || 'EFAN'}
                    </div>
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid items-stretch gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
                        <div className="order-1 flex min-h-full flex-col justify-start">
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/72">
        <Link href="/" className="transition-colors hover:text-white">
            {PRODUCT_PAGE_COPY.breadcrumbHome}
        </Link>
        <span>/</span>
        <Link href="/products" className="transition-colors hover:text-white">
            {PRODUCT_PAGE_COPY.breadcrumbProducts}
        </Link>
        {product.category ? (
            <>
                <span>/</span>
                <Link href={`/products/category/${categorySlug}`} className="transition-colors hover:text-white">
                    {product.category.name}
                </Link>
                <span>/</span>
                <span className="text-white">{product.model || product.name}</span>
            </>
        ) : null}
    </nav>

    <div className="relative w-full">
        <ProductImageGallery
            images={galleryImages}
            productName={product.imageAlt || `${product.brand || ""} ${product.model || ""} ${product.name}`.trim()}
        />
    </div>
</div>

<div className="order-2 flex flex-col justify-between py-6 lg:pt-16 lg:pb-6">
                            <div>
                                <div className="mb-5 pt-2">
    <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
        {product.name}
    </h1>
</div>

                                <div className="mt-8">
                                    {summaryItems.length > 0 ? (
                                        <ul className="space-y-3 text-sm font-black leading-8 text-white">
                                            {summaryItems.map((item, index) => (
                                                <li key={`${item}-${index}`} className="flex items-start gap-3">
                                                    <span className="pt-[1px] text-base font-black text-cyan-200">✦</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}

                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-4 border-t border-white/12 pt-6 md:flex-row md:items-end md:justify-between">
                                <ProductDetailClient
                                    product={{
                                        id: product.id,
                                        name: product.name,
                                        brand: product.brand,
                                        model: product.model,
                                        imageUrl: absoluteMainImage,
                                    }}
                                    compact
                                />

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold text-white/72">
                                    <span>需要專業規劃？</span>
                                    <a href={`tel:${company.phone}`} className="text-lg font-black leading-none text-white">
                                        {company.phone}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {contentImages.length > 0 ? (
                <section className="border-t border-gray-100 bg-white py-10 sm:py-14">
                    <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                        {contentImages.map((image, index) => (
                            <div
                                key={image.id}
                                className="overflow-hidden rounded-[28px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] shadow-[0_24px_60px_-48px_rgba(15,23,42,0.4)]"
                            >
                                <div className="relative aspect-[16/9] bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4 sm:p-5">
                                    <Image
                                        src={normalizeImageSrc(image.filepath)}
                                        alt={`${product.name} ${PRODUCT_PAGE_COPY.imageGallerySuffix} ${index + 1}`}
                                        fill
                                        sizes="(min-width: 1280px) 1280px, 100vw"
                                        quality={90}
                                        unoptimized={shouldBypassImageOptimization(image.filepath)}
                                        className={`${image.displayMode === 'cover' ? 'object-cover' : 'object-contain p-2 sm:p-3'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {tabs.length > 0 ? (
                <section className="border-t border-gray-100 bg-white py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <ProductTabs tabs={tabs} />
                    </div>
                </section>
            ) : null}

            {false && relatedWithSlug.length > 0 ? (
                <section className="border-t border-gray-100 bg-[linear-gradient(180deg,#f8fafc,#ffffff_28%)] py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-10 max-w-3xl">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-efan-primary">{PRODUCT_PAGE_COPY.relatedEyebrow}</div>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">{PRODUCT_PAGE_COPY.relatedTitle}</h2>
                            <p className="mt-3 text-sm leading-7 text-gray-500">
                                {PRODUCT_PAGE_COPY.relatedDescription}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {relatedWithSlug.map((item) => (
                                <ProductDetailClient key={item.id} relatedProduct={item} />
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {relatedWithSlug.length > 0 ? (
                <section className="border-t border-gray-100 bg-[linear-gradient(180deg,#f7fafc,#ffffff_32%)] py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="overflow-hidden rounded-[36px] border border-gray-200 bg-white shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)]">
                            <div className="grid gap-0 lg:grid-cols-[1.05fr_1.95fr]">
                                <div className="border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,#edf5ff,white_62%)] px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-efan-primary">{PRODUCT_PAGE_COPY.relatedEyebrow}</div>
                                    <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">{PRODUCT_PAGE_COPY.compareProductsTitle}</h2>
                                    <p className="mt-4 text-sm leading-7 text-gray-600">
                                        {PRODUCT_PAGE_COPY.compareProductsDescription.replace('這款產品', product.model || product.name)}
                                    </p>
                                    <div className="mt-6 rounded-[24px] border border-white/70 bg-white/75 px-5 py-5">
                                        <div className="text-sm font-black text-gray-900">{PRODUCT_PAGE_COPY.compareChecklistTitle}</div>
                                        <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-600">
                                            {PRODUCT_PAGE_COPY.compareChecklist.map((item) => (
                                                <li key={item}>• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="px-6 py-6 sm:px-8 sm:py-8">
                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                        {relatedWithSlug.map((item) => {
                                            const summary = stripHtml(item.description || '').trim();
                                            const compareSummary = summary || `${item.name} 的定位與功能接近 ${product.model || product.name}，適合一起比較規格差異與應用場景。`;

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.slug ? `/products/${item.slug}` : '/products'}
                                                    className="group flex h-full gap-4 rounded-[26px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-efan-primary/20 hover:shadow-[0_24px_50px_-36px_rgba(30,64,175,0.35)]"
                                                >
                                                    <div className="relative h-24 w-24 flex-none overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_top,#f8fbff,white_60%,#eef2f7)]">
                                                        {item.imageUrl ? (
                                                            <Image
                                                                src={normalizeImageSrc(item.imageUrl)}
                                                                alt={item.name}
                                                                fill
                                                                sizes="96px"
                                                                unoptimized={shouldBypassImageOptimization(item.imageUrl)}
                                                                className="object-contain p-3"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-xs font-black uppercase tracking-[0.2em] text-gray-300">
                                                                {item.brand || 'EFAN'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {item.brand ? (
                                                                <span className="rounded-full bg-efan-primary/8 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-efan-primary">
                                                                    {item.brand}
                                                                </span>
                                                            ) : null}
                                                            {item.model ? (
                                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                                                                    {item.model}
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <h3 className="mt-3 text-lg font-black leading-7 text-gray-900 transition-colors group-hover:text-efan-primary">
                                                            {item.name}
                                                        </h3>
                                                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-gray-600">
                                                            {compareSummary}
                                                        </p>

                                                        <div className="mt-4 flex items-center justify-between gap-3">
                                                            <span className="text-sm font-bold text-gray-500">
                                                                {item.category?.name || PRODUCT_PAGE_COPY.categoryFallback}
                                                            </span>
                                                            <span className="text-sm font-black text-efan-primary">{PRODUCT_PAGE_COPY.viewProduct}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
