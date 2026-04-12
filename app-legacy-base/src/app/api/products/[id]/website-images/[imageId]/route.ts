import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { unlink } from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { resolveApiUploadPath } from '@/lib/runtime-paths';

// DELETE — 刪除單張前台圖片
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; imageId: string }> }
) {
    return withAuth(request, async () => {
        const { id, imageId } = await params;

        const image = await prisma.uploadedFile.findFirst({
            where: { id: imageId, entityType: 'product_website', entityId: id },
        });

        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        // Delete file from disk
        try {
            const filepath = resolveApiUploadPath(image.filepath);
            await unlink(filepath);
        } catch {
            // File might not exist, continue with DB deletion
        }

        // Delete record
        await prisma.uploadedFile.delete({ where: { id: imageId } });

        return NextResponse.json({ success: true });
    });
}
