import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { unlink } from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { resolveApiUploadPath } from '@/lib/runtime-paths';
import { revalidateProductSite } from '@/lib/revalidate-public';

const ENTITY_TYPE = 'product_content_image';

const ALLOWED_DISPLAY_MODES = new Set(['contain', 'cover']);

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; imageId: string }> },
) {
    return withAuth(request, async () => {
        const { id, imageId } = await params;
        const body = await request.json();
        const displayMode = typeof body.displayMode === 'string' ? body.displayMode : '';

        if (!ALLOWED_DISPLAY_MODES.has(displayMode)) {
            return NextResponse.json({ error: 'Invalid display mode' }, { status: 400 });
        }

        const image = await prisma.uploadedFile.findFirst({
            where: { id: imageId, entityType: ENTITY_TYPE, entityId: id },
            select: { id: true },
        });

        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const [updatedImage, product] = await Promise.all([
            prisma.uploadedFile.update({
                where: { id: imageId },
                data: { displayMode },
                select: {
                    id: true,
                    displayMode: true,
                },
            }),
            prisma.product.findUnique({
                where: { id },
                select: { seoSlug: true },
            }),
        ]);

        revalidateProductSite({ productSlug: product?.seoSlug });

        return NextResponse.json({ image: updatedImage });
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; imageId: string }> },
) {
    return withAuth(request, async () => {
        const { id, imageId } = await params;

        const image = await prisma.uploadedFile.findFirst({
            where: { id: imageId, entityType: ENTITY_TYPE, entityId: id },
            select: { id: true, filepath: true },
        });

        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        try {
            const filepath = resolveApiUploadPath(image.filepath);
            await unlink(filepath);
        } catch {
            // Ignore missing files on disk; delete DB row anyway.
        }

        await prisma.uploadedFile.delete({ where: { id: imageId } });

        const product = await prisma.product.findUnique({
            where: { id },
            select: { seoSlug: true },
        });

        revalidateProductSite({ productSlug: product?.seoSlug });

        return NextResponse.json({ success: true });
    });
}
