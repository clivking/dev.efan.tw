import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getCategoryDisplayName } from '@/lib/category-slugs';

/**
 * GET /api/public/products/categories
 * Public category listing — nested structure.
 * Only returns categories with showOnWebsite=true and visible products.
 */
export async function GET() {
    try {
        const allCategories = await prisma.productCategory.findMany({
            where: { showOnWebsite: true },
            select: {
                id: true,
                name: true,
                sortOrder: true,
                parentId: true,
                seoSlug: true,
                seoTitle: true,
                seoDescription: true,
                _count: {
                    select: {
                        products: {
                            where: { isDeleted: false, isHiddenItem: false, showOnWebsite: true },
                        },
                    },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        const topLevel = allCategories.filter(c => !c.parentId);
        const childrenMap = new Map<string, typeof allCategories>();
        for (const cat of allCategories) {
            if (cat.parentId) {
                if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
                childrenMap.get(cat.parentId)!.push(cat);
            }
        }

        const categories = topLevel
            .map(parent => {
                const children = (childrenMap.get(parent.id) || [])
                    .filter(c => c._count.products > 0)
                    .map(c => ({
                        id: c.id,
                        name: c.name,
                        slug: c.seoSlug || c.id,
                        productCount: c._count.products,
                        sortOrder: c.sortOrder,
                    }));

                const totalProductCount = parent._count.products + children.reduce((sum, c) => sum + c.productCount, 0);

                return {
                    id: parent.id,
                    name: parent.name,
                    displayName: getCategoryDisplayName(parent.name),
                    slug: parent.seoSlug || parent.id,
                    productCount: totalProductCount,
                    sortOrder: parent.sortOrder,
                    children,
                };
            })
            .filter(c => c.productCount > 0 || c.children.length > 0);

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Public categories API error:', error);
        return NextResponse.json(
            { error: '無法載入分類資料' },
            { status: 500 }
        );
    }
}
