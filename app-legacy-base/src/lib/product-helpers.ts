import { prisma } from '@/lib/prisma';
import { normalizeImageSrc } from '@/lib/image-paths';

/**
 * Get the main image URL for a single product.
 * Main image = first uploaded_file with entityType='product_website' ordered by sortOrder.
 */
export async function getProductMainImage(productId: string): Promise<string | null> {
    const image = await prisma.uploadedFile.findFirst({
        where: {
            entityType: 'product_website',
            entityId: productId,
        },
        orderBy: { sortOrder: 'asc' },
        select: { filepath: true },
    });
    return image?.filepath ? normalizeImageSrc(image.filepath) : null;
}

/**
 * Get main image URLs for multiple products (batch query, avoids N+1).
 * Returns a Map of productId → imageUrl (or null if no image).
 */
export async function getProductMainImages(
    productIds: string[]
): Promise<Map<string, string | null>> {
    if (productIds.length === 0) return new Map();

    const images = await prisma.uploadedFile.findMany({
        where: {
            entityType: 'product_website',
            entityId: { in: productIds },
        },
        orderBy: { sortOrder: 'asc' },
        select: { entityId: true, filepath: true },
    });

    // Group by entityId, take first (lowest sortOrder) per product
    const map = new Map<string, string | null>();
    const seen = new Set<string>();
    for (const img of images) {
        if (img.entityId && !seen.has(img.entityId)) {
            seen.add(img.entityId);
            map.set(img.entityId, normalizeImageSrc(img.filepath));
        }
    }

    // Fill in nulls for products with no image
    for (const id of productIds) {
        if (!map.has(id)) {
            map.set(id, null);
        }
    }

    return map;
}

/**
 * Strip HTML tags from a string, returning plain text.
 * Used for ProductCard descriptions, SEO meta, etc.
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
