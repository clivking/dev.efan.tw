import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

// GET — list documents for a product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const documents = await prisma.uploadedFile.findMany({
            where: { entityType: 'product_document', entityId: id },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true, filename: true, filepath: true, mimetype: true,
                size: true, sortOrder: true, title: true, description: true, docType: true,
            },
        });
        return NextResponse.json({ documents });
    });
}

// POST — create a document record (file already uploaded via /api/upload/document)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await request.json();
        const { filepath, filename, mimetype, size, title, description, docType } = body;

        if (!filepath || !filename) {
            return NextResponse.json({ error: 'filepath and filename are required' }, { status: 400 });
        }

        // Verify product exists
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const maxSort = await prisma.uploadedFile.aggregate({
            where: { entityType: 'product_document', entityId: id },
            _max: { sortOrder: true },
        });

        const document = await prisma.uploadedFile.create({
            data: {
                filename,
                filepath,
                mimetype: mimetype || null,
                size: size || null,
                entityType: 'product_document',
                entityId: id,
                uploadedBy: req.user!.id,
                sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
                title: title || null,
                description: description || null,
                docType: docType || null,
            },
        });

        return NextResponse.json({ document });
    });
}

// PUT — reorder documents
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const body = await request.json();
        const { documentIds } = body;

        if (!Array.isArray(documentIds)) {
            return NextResponse.json({ error: 'documentIds array required' }, { status: 400 });
        }

        await prisma.$transaction(
            documentIds.map((docId: string, index: number) =>
                prisma.uploadedFile.updateMany({
                    where: { id: docId, entityType: 'product_document', entityId: id },
                    data: { sortOrder: index },
                })
            )
        );

        return NextResponse.json({ success: true });
    });
}
