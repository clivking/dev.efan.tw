import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { buildCanonicalProductDocumentPath } from '@/lib/product-upload-paths';

const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
];
const MAX_SIZE = 20 * 1024 * 1024;

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

// POST — upload and create a product document record
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;

        // Verify product exists
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const contentType = request.headers.get('content-type') || '';
        let filepath = '';
        let filename = '';
        let mimetype = 'application/octet-stream';
        let size = 0;
        let title: string | null = null;
        let description: string | null = null;
        let docType: string | null = null;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json({ error: '不支援的檔案格式。允許：PDF, JPG, PNG, WEBP' }, { status: 400 });
            }

            if (file.size > MAX_SIZE) {
                return NextResponse.json({ error: '檔案過大（上限 20MB）' }, { status: 400 });
            }

            docType = typeof formData.get('docType') === 'string' ? String(formData.get('docType')) : null;
            title = typeof formData.get('title') === 'string' ? String(formData.get('title')) || null : null;
            description = typeof formData.get('description') === 'string' ? String(formData.get('description')) || null : null;

            const target = buildCanonicalProductDocumentPath({
                product,
                originalFilename: file.name,
                mimetype: file.type,
                docType,
            });
            const buffer = Buffer.from(await file.arrayBuffer());

            await mkdir(path.dirname(target.absolutePath), { recursive: true });
            await writeFile(target.absolutePath, buffer);

            filepath = target.apiPath;
            filename = target.filename;
            mimetype = file.type;
            size = file.size;
            docType = target.docType;
        } else {
            const body = await request.json();
            filepath = body.filepath;
            filename = body.filename;
            mimetype = body.mimetype || 'application/octet-stream';
            size = typeof body.size === 'number' ? body.size : 0;
            title = body.title || null;
            description = body.description || null;
            docType = body.docType || null;

            if (!filepath || !filename) {
                return NextResponse.json({ error: 'filepath and filename are required' }, { status: 400 });
            }
        }

        const maxSort = await prisma.uploadedFile.aggregate({
            where: { entityType: 'product_document', entityId: id },
            _max: { sortOrder: true },
        });

        const document = await prisma.uploadedFile.create({
            data: {
                filename,
                filepath,
                mimetype,
                size,
                entityType: 'product_document',
                entityId: id,
                uploadedBy: req.user!.id,
                sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
                title,
                description,
                docType,
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
