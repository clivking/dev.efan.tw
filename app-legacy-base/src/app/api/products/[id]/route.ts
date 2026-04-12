import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { sanitizeFeatures } from '@/lib/tiptap';
import { revalidateProductSite } from '@/lib/revalidate-public';

// GET — 取得單一產品（含 content 欄位 + specTemplate + 圖片/文件）
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        sortOrder: true,
                        parentId: true,
                        showOnWebsite: true,
                        seoTitle: true,
                        seoDescription: true,
                        seoSlug: true,
                        specTemplate: true,
                    },
                },
                bundleItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Fetch website images and documents
        const [websiteImages, contentImages, documents] = await Promise.all([
            prisma.uploadedFile.findMany({
                where: { entityType: 'product_website', entityId: id },
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    filename: true,
                    filepath: true,
                    mimetype: true,
                    size: true,
                    sortOrder: true,
                },
            }),
            prisma.uploadedFile.findMany({
                where: { entityType: 'product_content_image', entityId: id },
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    filename: true,
                    filepath: true,
                    mimetype: true,
                    size: true,
                    sortOrder: true,
                    displayMode: true,
                },
            }),
            prisma.uploadedFile.findMany({
                where: { entityType: 'product_document', entityId: id },
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    filename: true,
                    filepath: true,
                    mimetype: true,
                    size: true,
                    sortOrder: true,
                    title: true,
                    description: true,
                    docType: true,
                },
            }),
        ]);

        return NextResponse.json({
            product,
            websiteImages,
            contentImages,
            documents,
            specTemplate: product.category?.specTemplate || null,
        });
    });
}

// Allowed fields for partial update
const ALLOWED_FIELDS = [
    // Tab 1: 報價資訊
    'name', 'categoryId', 'brand', 'model', 'description',
    'unit', 'type',
    'costPrice', 'sellingPrice', 'marketPrice', 'repairPrice',
    'trackInventory', 'currentStock', 'lowStockThreshold',
    'quoteName', 'quoteDesc', 'isHiddenItem', 'isQuickAccess',
    'isAI', 'isHot', 'isNew', 'notes',
    // Tab 2: 網站展示
    'showOnWebsite', 'websiteDescription',
    'content', 'specifications', 'videoUrl', 'faqs',
    'productUrl', 'useCases', 'bestFor', 'notFor', 'compatibility',
    'installationNotes', 'maintenanceTips', 'comparisonNotes', 'imageAlt', 'imageCaption',
    'seoTitle', 'seoSlug', 'seoDescription', 'seoKeywords',
    'targetKeyword', 'secondaryKeywords', 'searchIntent',
    'sourceUrl', 'sourceCheckedAt', 'contentStatus', 'contentReviewedAt', 'needsRevalidation',
    'seoRatingValue', 'seoRatingCount', 'seoReviews',
];

// PUT — Conditional update（只更新有傳入的欄位）
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await request.json();

        // Read existing product for merge validation
        const existing = await prisma.product.findUnique({
            where: { id },
            include: { bundleItems: true }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Build updateData: only include fields that are explicitly sent
        const updateData: Record<string, any> = {};
        for (const field of ALLOWED_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Merge with existing values for validation
        const merged = { ...existing, ...updateData } as any;

        // --- Validation: prices ---
        if (merged.costPrice !== undefined && merged.costPrice < 0) {
            return NextResponse.json({ error: '成本價不可為負數' }, { status: 400 });
        }
        if (merged.sellingPrice !== undefined && merged.sellingPrice < 0) {
            return NextResponse.json({ error: '售價不可為負數' }, { status: 400 });
        }
        if (merged.marketPrice && merged.marketPrice < 0) {
            return NextResponse.json({ error: '市場參考價不可為負數' }, { status: 400 });
        }
        if (merged.repairPrice && merged.repairPrice < 0) {
            return NextResponse.json({ error: '維修價不可為負數' }, { status: 400 });
        }

        // --- Validation: SEO slug format & uniqueness ---
        if (updateData.seoSlug !== undefined && updateData.seoSlug !== null && updateData.seoSlug !== '') {
            if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(updateData.seoSlug)) {
                return NextResponse.json({ error: 'SEO slug 只允許小寫英文、數字和連字號，不可以連字號開頭或結尾' }, { status: 400 });
            }
            const slugConflict = await prisma.product.findFirst({
                where: { seoSlug: updateData.seoSlug, id: { not: id } },
            });
            if (slugConflict) {
                return NextResponse.json({ error: `SEO slug "${updateData.seoSlug}" 已被其他產品使用` }, { status: 400 });
            }
        }

        // --- Validation: showOnWebsite requires seoSlug (using merged value) ---
        if (merged.showOnWebsite && (!merged.seoSlug || String(merged.seoSlug).trim() === '')) {
            return NextResponse.json({ error: '發佈到前台時必須設定 SEO 網址' }, { status: 400 });
        }

        for (const urlField of ['productUrl', 'sourceUrl'] as const) {
            if (updateData[urlField] !== undefined && updateData[urlField] !== null && String(updateData[urlField]).trim() !== '') {
                try {
                    const parsed = new URL(String(updateData[urlField]));
                    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
                } catch {
                    return NextResponse.json({ error: `${urlField} 必須是合法網址` }, { status: 400 });
                }
            }
        }

        for (const listField of ['secondaryKeywords', 'useCases', 'bestFor', 'notFor', 'compatibility', 'installationNotes', 'maintenanceTips'] as const) {
            if (updateData[listField] !== undefined && updateData[listField] !== null) {
                if (!Array.isArray(updateData[listField])) {
                    return NextResponse.json({ error: `${listField} 必須是陣列格式` }, { status: 400 });
                }
                updateData[listField] = updateData[listField]
                    .map((item: unknown) => String(item).trim())
                    .filter(Boolean);
            }
        }

        if (updateData.searchIntent !== undefined && updateData.searchIntent !== null && updateData.searchIntent !== '') {
            if (!['informational', 'commercial', 'transactional'].includes(String(updateData.searchIntent))) {
                return NextResponse.json({ error: 'searchIntent 僅支援 informational、commercial、transactional' }, { status: 400 });
            }
        }

        if (updateData.contentStatus !== undefined && updateData.contentStatus !== null && updateData.contentStatus !== '') {
            if (!['draft', 'reviewed', 'published', 'stale'].includes(String(updateData.contentStatus))) {
                return NextResponse.json({ error: 'contentStatus 僅支援 draft、reviewed、published、stale' }, { status: 400 });
            }
        }

        for (const dateField of ['sourceCheckedAt', 'contentReviewedAt'] as const) {
            if (updateData[dateField] !== undefined) {
                if (updateData[dateField] === null || updateData[dateField] === '') {
                    updateData[dateField] = null;
                } else {
                    const parsed = new Date(updateData[dateField]);
                    if (Number.isNaN(parsed.getTime())) {
                        return NextResponse.json({ error: `${dateField} 日期格式錯誤` }, { status: 400 });
                    }
                    updateData[dateField] = parsed;
                }
            }
        }

        // --- Validation: specifications format (from content API) ---
        if (updateData.specifications !== undefined && updateData.specifications !== null) {
            if (!Array.isArray(updateData.specifications)) {
                return NextResponse.json({ error: 'specifications 必須是陣列格式' }, { status: 400 });
            }
        }

        // --- Validation: faqs format (from content API) ---
        if (updateData.faqs !== undefined && updateData.faqs !== null) {
            if (!Array.isArray(updateData.faqs)) {
                return NextResponse.json({ error: 'faqs 必須是陣列格式' }, { status: 400 });
            }
            for (const faq of updateData.faqs) {
                if (!faq.question || !faq.answer) {
                    return NextResponse.json({ error: '每個 FAQ 必須有 question 和 answer' }, { status: 400 });
                }
            }
        }

        // --- Validation: YouTube URL format (from content API) ---
        if (updateData.videoUrl !== undefined && updateData.videoUrl !== null && String(updateData.videoUrl).trim() !== '') {
            const ytMatch = updateData.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
            if (!ytMatch) {
                return NextResponse.json({ error: '請提供有效的 YouTube 影片網址' }, { status: 400 });
            }
        }

        // --- Validation: seoRatingValue range ---
        if (updateData.seoRatingValue !== undefined && updateData.seoRatingValue !== null && updateData.seoRatingValue !== '') {
            const val = Number(updateData.seoRatingValue);
            if (isNaN(val) || val < 1 || val > 5) {
                return NextResponse.json({ error: '評分必須在 1~5 之間' }, { status: 400 });
            }
            updateData.seoRatingValue = val;
        } else if (updateData.seoRatingValue === '') {
            updateData.seoRatingValue = null;
        }

        // --- Validation: seoRatingCount ---
        if (updateData.seoRatingCount !== undefined && updateData.seoRatingCount !== null && updateData.seoRatingCount !== '') {
            updateData.seoRatingCount = Number(updateData.seoRatingCount) || null;
        } else if (updateData.seoRatingCount === '') {
            updateData.seoRatingCount = null;
        }

        // --- Validation: seoReviews format ---
        if (updateData.seoReviews !== undefined && updateData.seoReviews !== null) {
            if (!Array.isArray(updateData.seoReviews)) {
                return NextResponse.json({ error: 'seoReviews 必須是陣列格式' }, { status: 400 });
            }
            for (const r of updateData.seoReviews) {
                if (!r.author || !r.body || !r.rating) {
                    return NextResponse.json({ error: '每則評價需有 author, body, rating' }, { status: 400 });
                }
            }
        }

        // --- Sanitize websiteDescription HTML at save time ---
        if (updateData.websiteDescription !== undefined && updateData.websiteDescription) {
            updateData.websiteDescription = sanitizeFeatures(updateData.websiteDescription);
        }

        // Handle seoSlug: convert empty string to null
        if (updateData.seoSlug !== undefined) {
            updateData.seoSlug = updateData.seoSlug || null;
        }

        // Handle videoUrl: convert empty string to null
        if (updateData.videoUrl !== undefined) {
            updateData.videoUrl = updateData.videoUrl || null;
        }

        // Handle bundleItems separately (relation, not a simple field)
        const bundleItems = body.bundleItems;

        const product = await prisma.$transaction(async (tx) => {
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    ...updateData,
                    bundleItems: bundleItems ? {
                        deleteMany: {},
                        create: bundleItems.map((bi: any) => ({
                            productId: bi.productId,
                            quantity: bi.quantity || 1,
                            sortOrder: bi.sortOrder || 0
                        }))
                    } : undefined
                } as any,
                include: {
                    category: true,
                    bundleItems: true
                }
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'update',
                tableName: 'products',
                recordId: id,
                before: existing as any,
                after: updatedProduct as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return updatedProduct;
        });

        revalidateProductSite();

        return NextResponse.json(product);
    });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;

        const before = await prisma.product.findUnique({ where: { id } });
        if (!before) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const product = await prisma.product.update({
            where: { id },
            data: { isDeleted: true }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'products',
            recordId: id,
            before: before as any,
            after: product as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        revalidateProductSite();

        return NextResponse.json({ success: true });
    });
}
