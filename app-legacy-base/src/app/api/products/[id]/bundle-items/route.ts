import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const bundleItems = await prisma.bundleItem.findMany({
            where: { bundleId: id },
            include: { product: true },
            orderBy: { sortOrder: 'asc' }
        });

        return NextResponse.json({ bundleItems });
    });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await request.json();
        const { productId, quantity = 1, sortOrder = 0 } = body;

        if (id === productId) {
            return NextResponse.json({ error: 'Cannot add product to itself' }, { status: 400 });
        }

        const productToAdd = await prisma.product.findUnique({ where: { id: productId } });
        if (!productToAdd || productToAdd.isDeleted) {
            return NextResponse.json({ error: 'Product to add not found or deleted' }, { status: 404 });
        }

        if (productToAdd.type === 'bundle') {
            return NextResponse.json({ error: 'Cannot add a bundle to another bundle' }, { status: 400 });
        }

        const bundleProduct = await prisma.product.findUnique({ where: { id } });
        if (!bundleProduct || bundleProduct.type !== 'bundle') {
            return NextResponse.json({ error: 'Parent product not found or not a bundle' }, { status: 400 });
        }

        const bundleItem = await prisma.bundleItem.create({
            data: {
                bundleId: id,
                productId,
                quantity,
                sortOrder
            },
            include: { product: true }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'create',
            tableName: 'bundle_items',
            recordId: bundleItem.id,
            after: bundleItem as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(bundleItem);
    });
}
