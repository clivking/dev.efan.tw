import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { getProductMainImages } from '@/lib/product-helpers';
import { revalidateProductSite } from '@/lib/revalidate-public';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const search = searchParams.get('search') || '';
        const categoryId = searchParams.get('categoryId') || '';
        const type = searchParams.get('type') || '';
        const includeDeleted = searchParams.get('includeDeleted') === 'true';

        const where: any = {
            isDeleted: includeDeleted ? undefined : false,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (type) {
            where.type = type;
        }

        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    brand: true,
                    model: true,
                    description: true,
                    type: true,
                    unit: true,
                    costPrice: true,
                    marketPrice: true,
                    sellingPrice: true,
                    repairPrice: true,

                    productUrl: true,
                    isHiddenItem: true,
                    isAI: true,
                    isHot: true,
                    isNew: true,
                    isDeleted: true,
                    showOnWebsite: true,
                    sortOrder: true,
                    seoSlug: true,
                    categoryId: true,
                    currentStock: true,
                    lowStockThreshold: true,
                    trackInventory: true,
                    createdAt: true,
                    updatedAt: true,
                    category: { select: { id: true, name: true } },
                },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        // Batch-fetch main images from uploaded_files
        const productIds = products.map(p => p.id);
        const imageMap = await getProductMainImages(productIds);

        const productsWithImages = products.map(p => ({
            ...p,
            imageUrl: imageMap.get(p.id) ?? null,
        }));

        return NextResponse.json({
            products: productsWithImages,
            total,
            page,
            pageSize
        });
    });
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const body = await request.json();
        const {
            categoryId,
            brand,
            model,
            name,
            description,
            quoteName,
            quoteDesc,
            type = 'single',
            unit,
            costPrice,
            marketPrice,
            sellingPrice,
            repairPrice,
            isHiddenItem = false,
            isAI = false,
            isHot = false,
            isNew = false,
            productUrl,
            notes,
            currentStock = 0,
            lowStockThreshold = 0,
            trackInventory = false,
            bundleItems = []
        } = body;

        if (!name || !categoryId || costPrice === undefined || sellingPrice === undefined) {
            return NextResponse.json({ error: 'Required fields missing: name, categoryId, costPrice, sellingPrice' }, { status: 400 });
        }

        if (costPrice < 0 || sellingPrice < 0 || (marketPrice && marketPrice < 0) || (repairPrice && repairPrice < 0)) {
            return NextResponse.json({ error: 'Prices cannot be negative' }, { status: 400 });
        }

        const product = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    categoryId,
                    brand,
                    model,
                    name,
                    description,
                    quoteName,
                    quoteDesc,
                    type,
                    unit,
                    costPrice,
                    marketPrice,
                    sellingPrice,
                    repairPrice,
                    isHiddenItem,
                    isAI,
                    isHot,
                    isNew,
                    productUrl,
                    notes,
                    currentStock,
                    lowStockThreshold,
                    trackInventory,
                    bundleItems: type === 'bundle' ? {
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
                action: 'create',
                tableName: 'products',
                recordId: newProduct.id,
                after: newProduct as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return newProduct;
        });

        revalidateProductSite();

        return NextResponse.json(product);
    });
}
