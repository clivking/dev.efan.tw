import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getProductMainImage, getProductMainImages } from '@/lib/product-helpers';

/**
 * GET /api/public/products/[id]
 * Public single product detail — NO authentication required.
 * Accepts either seo_slug or UUID.
 * Returns whitelist-filtered fields only — NO prices, NO costs.
 * Only returns products with showOnWebsite=true.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Try by seo_slug first, then by UUID
        let product = await prisma.product.findFirst({
            where: {
                seoSlug: id,
                isDeleted: false,
                showOnWebsite: true,
            },
            select: {
                id: true,
                name: true,
                brand: true,
                model: true,
                description: true,
                websiteDescription: true,
                type: true,
                unit: true,
                categoryId: true,
                seoSlug: true,
                seoTitle: true,
                seoDescription: true,
                seoKeywords: true,
                category: {
                    select: { id: true, name: true, seoSlug: true },
                },
            },
        });

        // Fallback: try by UUID
        if (!product) {
            product = await prisma.product.findFirst({
                where: {
                    id,
                    isDeleted: false,
                    showOnWebsite: true,
                },
                select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    description: true,
                    websiteDescription: true,
                    type: true,
                    unit: true,
                    categoryId: true,
                    seoSlug: true,
                    seoTitle: true,
                    seoDescription: true,
                    seoKeywords: true,
                    category: {
                        select: { id: true, name: true, seoSlug: true },
                    },
                },
            });
        }

        if (!product) {
            return NextResponse.json(
                { error: '找不到此產品' },
                { status: 404 }
            );
        }

        // Main image from uploaded_files
        const mainImage = await getProductMainImage(product.id);

        // Website images
        const websiteImages = await prisma.uploadedFile.findMany({
            where: { entityType: 'product_website', entityId: product.id },
            orderBy: { sortOrder: 'asc' },
            select: { filepath: true, filename: true },
        });

        // Related products: same category, exclude self, max 4, only showOnWebsite
        const relatedProducts = await prisma.product.findMany({
            where: {
                categoryId: product.categoryId,
                id: { not: product.id },
                isDeleted: false,
                isHiddenItem: false,
                showOnWebsite: true,
            },
            select: {
                id: true,
                name: true,
                brand: true,
                model: true,
                seoSlug: true,
            },
            take: 4,
            orderBy: { createdAt: 'desc' },
        });

        // Batch-fetch images for related products
        const relatedIds = relatedProducts.map(r => r.id);
        const relatedImageMap = await getProductMainImages(relatedIds);

        return NextResponse.json({
            product: {
                id: product.id,
                name: product.name,
                brand: product.brand,
                model: product.model,
                description: product.description,
                imageUrl: mainImage,
                type: product.type,
                unit: product.unit,
                slug: product.seoSlug || product.id,
                seoTitle: product.seoTitle,
                seoDescription: product.seoDescription,
                seoKeywords: product.seoKeywords,
                websiteImages: websiteImages.map(img => img.filepath),
                category: product.category ? {
                    id: product.category.id,
                    name: product.category.name,
                    slug: product.category.seoSlug || product.category.id,
                } : null,
            },
            relatedProducts: relatedProducts.map(r => ({
                id: r.id,
                name: r.name,
                brand: r.brand,
                model: r.model,
                imageUrl: relatedImageMap.get(r.id) ?? null,
                slug: r.seoSlug || r.id,
            })),
        });
    } catch (error) {
        console.error('Public product detail API error:', error);
        return NextResponse.json(
            { error: '無法載入產品資料' },
            { status: 500 }
        );
    }
}
