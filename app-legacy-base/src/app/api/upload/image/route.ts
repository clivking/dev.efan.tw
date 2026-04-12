import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { resolveUploadSubpath } from '@/lib/runtime-paths';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP, GIF are allowed.' }, { status: 400 });
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size too large (max 5MB)' }, { status: 400 });
        }

        const folder = formData.get('folder') as string || 'products';
        const entityType = formData.get('entityType') as string || 'product';

        // Limit allowed folders for security
        const allowedFolders = ['products', 'settings'];
        if (!allowedFolders.includes(folder)) {
            return NextResponse.json({ error: 'Invalid folder choice' }, { status: 400 });
        }

        const rawBuffer = Buffer.from(await file.arrayBuffer());

        // Convert non-WebP images to WebP (quality 82, max 2000px wide)
        let outputBuffer: Buffer;
        let outputMime: string;
        let outputExt: string;
        if (file.type === 'image/webp') {
            outputBuffer = rawBuffer;
            outputMime = 'image/webp';
            outputExt = '.webp';
        } else if (file.type === 'image/gif') {
            // Keep GIF as-is (may be animated)
            outputBuffer = rawBuffer;
            outputMime = 'image/gif';
            outputExt = '.gif';
        } else {
            outputBuffer = await sharp(rawBuffer)
                .resize({ width: 2000, withoutEnlargement: true })
                .webp({ quality: 82 })
                .toBuffer();
            outputMime = 'image/webp';
            outputExt = '.webp';
        }

        const filename = `${uuidv4()}${outputExt}`;
        const uploadDir = resolveUploadSubpath(folder);
        const filepath = path.join(uploadDir, filename);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Save file
        await writeFile(filepath, outputBuffer);

        const relativePath = `/api/uploads/${folder}/${filename}`;

        // Record in UploadedFile table
        await prisma.uploadedFile.create({
            data: {
                filename: file.name,
                filepath: relativePath,
                mimetype: outputMime,
                size: outputBuffer.length,
                entityType: entityType,
                uploadedBy: req.user!.id
            }
        });

        return NextResponse.json({ url: relativePath });
    });
}
