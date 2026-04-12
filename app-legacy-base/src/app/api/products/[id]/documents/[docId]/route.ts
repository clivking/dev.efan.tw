import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { unlink } from 'fs/promises';
import { resolveApiUploadPath } from '@/lib/runtime-paths';

// PUT — update document metadata
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
    return withAuth(request, async () => {
        const { id, docId } = await params;
        const body = await request.json();
        const { title, description, docType } = body;

        const doc = await prisma.uploadedFile.findFirst({
            where: { id: docId, entityType: 'product_document', entityId: id },
        });
        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const updated = await prisma.uploadedFile.update({
            where: { id: docId },
            data: {
                ...(title !== undefined && { title: title || null }),
                ...(description !== undefined && { description: description || null }),
                ...(docType !== undefined && { docType: docType || null }),
            },
        });

        return NextResponse.json({ document: updated });
    });
}

// DELETE — delete document + physical file
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
    return withAuth(request, async () => {
        const { id, docId } = await params;

        const doc = await prisma.uploadedFile.findFirst({
            where: { id: docId, entityType: 'product_document', entityId: id },
        });
        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete physical file
        try {
            const filePath = resolveApiUploadPath(doc.filepath);
            await unlink(filePath);
        } catch {
            // File might not exist, continue with DB deletion
        }

        await prisma.uploadedFile.delete({ where: { id: docId } });

        return NextResponse.json({ success: true });
    });
}
