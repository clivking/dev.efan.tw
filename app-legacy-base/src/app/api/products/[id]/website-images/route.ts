import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { resolveUploadSubpath } from '@/lib/runtime-paths';

// GET — 取得產品的前台圖片列表
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const images = await prisma.uploadedFile.findMany({
            where: { entityType: 'product_website', entityId: id },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                filename: true,
                filepath: true,
                mimetype: true,
                size: true,
                sortOrder: true,
            },
        });
        return NextResponse.json({ images });
    });
}

// POST — 上傳前台圖片
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;

        // Verify product exists
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP, GIF allowed.' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size too large (max 5MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}${path.extname(file.name)}`;
        const uploadDir = resolveUploadSubpath('products');
        const filepath = path.join(uploadDir, filename);

        await mkdir(uploadDir, { recursive: true });
        await writeFile(filepath, buffer);

        const relativePath = `/api/uploads/products/${filename}`;

        // Get current max sort_order
        const maxSort = await prisma.uploadedFile.aggregate({
            where: { entityType: 'product_website', entityId: id },
            _max: { sortOrder: true },
        });

        const record = await prisma.uploadedFile.create({
            data: {
                filename: file.name,
                filepath: relativePath,
                mimetype: file.type,
                size: file.size,
                entityType: 'product_website',
                entityId: id,
                uploadedBy: req.user!.id,
                sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
            },
        });

        return NextResponse.json({
            image: {
                id: record.id,
                filename: record.filename,
                filepath: record.filepath,
                sortOrder: record.sortOrder,
            },
        });
    });
}

// PUT — 重新排序圖片
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const body = await request.json();
        const { imageIds } = body;

        if (!Array.isArray(imageIds)) {
            return NextResponse.json({ error: 'imageIds array required' }, { status: 400 });
        }

        await prisma.$transaction(
            imageIds.map((imageId: string, index: number) =>
                prisma.uploadedFile.updateMany({
                    where: { id: imageId, entityType: 'product_website', entityId: id },
                    data: { sortOrder: index },
                })
            )
        );

        return NextResponse.json({ success: true });
    });
}
