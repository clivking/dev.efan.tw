import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getCategoryDisplayName } from '@/lib/category-slugs';
import { getProductMainImages, stripHtml } from '@/lib/product-helpers';

/**
 * GET /api/public/products
 * Public product listing — NO authentication required.
 * Whitelist-filtered fields only (NO prices, NO costs, NO internal notes).
 * Only returns products with showOnWebsite=true.
 *
 * Query params:
 *   category: slug — if top-level, returns all children's products
 *   search: text search across name, brand, model, description
 *   page, limit: pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const search = searchParams.get('search') || '';
        const categorySlug = searchParams.get('category') || '';

        // Build where clause
        const where: any = {
            isDeleted: false,
            isHiddenItem: false,
            showOnWebsite: true,        // ← 只顯示前台產品
        };

        // Category filter — resolves hierarchy using DB seoSlug
        if (categorySlug) {
            const categoryIds = await resolveCategoryIds(categorySlug);
            if (categoryIds && categoryIds.length > 0) {
                where.categoryId = { in: categoryIds };
            } else {
                return NextResponse.json({
                    products: [],
                    pagination: { page, limit, total: 0, totalPages: 0 },
                });
            }
        }

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                select: {
                    // WHITELIST: only safe fields — NO prices, NO costs
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    description: true,
                    websiteDescription: true,
                    type: true,
                    seoSlug: true,
                    specifications: true,
                    isAI: true,
                    isHot: true,
                    isNew: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            parentId: true,
                            seoSlug: true,
                            parent: { select: { id: true, name: true, seoSlug: true } },
                        },
                    },
                },
                orderBy: [
                    { category: { sortOrder: 'asc' } },
                    { createdAt: 'desc' },
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        // Batch-fetch main images
        const productIds = products.map(p => p.id);
        const imageMap = await getProductMainImages(productIds);

        return NextResponse.json({
            products: products.map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                model: p.model,
                description: p.description,
                imageUrl: imageMap.get(p.id) ?? null,
                type: p.type,
                slug: p.seoSlug || p.id,
                specifications: p.specifications,
                isAI: p.isAI,
                isHot: p.isHot,
                isNew: p.isNew,
                category: p.category ? {
                    id: p.category.id,
                    name: p.category.name,
                    slug: p.category.seoSlug || p.category.id,
                    parent: p.category.parent ? {
                        id: p.category.parent.id,
                        name: p.category.parent.name,
                        displayName: getCategoryDisplayName(p.category.parent.name),
                        slug: p.category.parent.seoSlug || p.category.parent.id,
                    } : null,
                } : null,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Public products API error:', error);
        return NextResponse.json(
            { error: '無法載入產品資料' },
            { status: 500 }
        );
    }
}

/**
 * Resolve a category slug to category IDs.
 * Uses DB seo_slug field instead of hardcoded map.
 */
async function resolveCategoryIds(slug: string): Promise<string[] | null> {
    // Find by seo_slug
    const category = await prisma.productCategory.findFirst({
        where: { seoSlug: slug, showOnWebsite: true },
        select: { id: true, parentId: true },
    });

    if (!category) return null;

    if (!category.parentId) {
        // Top-level → include self + all children
        const children = await prisma.productCategory.findMany({
            where: { parentId: category.id, showOnWebsite: true },
            select: { id: true },
        });
        return [category.id, ...children.map(c => c.id)];
    }

    return [category.id];
}
