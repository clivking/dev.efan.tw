import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { revalidateProductSite } from '@/lib/revalidate-public';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await request.json();
        const { name, parentId, sortOrder, showOnWebsite, seoTitle, seoDescription, seoSlug, specTemplate } = body;

        const before = await prisma.productCategory.findUnique({ where: { id } });
        if (!before) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Validate seo_slug format and uniqueness
        if (seoSlug !== undefined && seoSlug !== null && seoSlug !== '') {
            if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(seoSlug)) {
                return NextResponse.json({ error: 'SEO slug 只允許小寫英文、數字和連字號' }, { status: 400 });
            }
            const existing = await prisma.productCategory.findFirst({
                where: { seoSlug, id: { not: id } },
            });
            if (existing) {
                return NextResponse.json({ error: `SEO slug "${seoSlug}" 已被其他分類使用` }, { status: 400 });
            }
        }

        const category = await prisma.productCategory.update({
            where: { id },
            data: {
                name,
                parentId,
                sortOrder,
                ...(showOnWebsite !== undefined && { showOnWebsite }),
                ...(seoTitle !== undefined && { seoTitle: seoTitle || null }),
                ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
                ...(seoSlug !== undefined && { seoSlug: seoSlug || null }),
                ...(specTemplate !== undefined && { specTemplate }),
            }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'product_categories',
            recordId: category.id,
            before: before as any,
            after: category as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        revalidateProductSite();

        return NextResponse.json(category);
    });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const cascade = searchParams.get('cascade') === 'true';

        const before = await prisma.productCategory.findUnique({ where: { id } });
        if (!before) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        const productCount = await prisma.product.count({
            where: { categoryId: id, isDeleted: false }
        });

        if (productCount > 0 && !cascade) {
            return NextResponse.json({
                error: 'Cannot delete category with active products',
                productCount
            }, { status: 400 });
        }

        // Perform deletion in a transaction
        await prisma.$transaction(async (tx) => {
            if (cascade) {
                // Instead of hard delete, maybe we should mark as isDeleted?
                // The current schema has isDeleted on Product but not on ProductCategory.
                // Looking at the provided schema, ProductCategory doesn't have isDeleted.
                // So we do a hard delete for the category, but let's see if we should soft delete products.
                // If the user said "全部刪除乾淨", let's do hard delete or soft delete depending on existing patterns.
                // Product has isDeleted field.
                await tx.product.updateMany({
                    where: { categoryId: id },
                    data: { isDeleted: true }
                });
            }

            // Now delete the category (ProductCategory doesn't have isDeleted, so hard delete)
            await tx.productCategory.delete({ where: { id } });
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'product_categories',
            recordId: id,
            before: before as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        revalidateProductSite();

        return NextResponse.json({ success: true });
    });
}
