import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { resolveUploadSubpath } from '@/lib/runtime-paths';

const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
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

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}${path.extname(file.name)}`;
        const uploadDir = resolveUploadSubpath('documents');
        const filepath = path.join(uploadDir, filename);

        await mkdir(uploadDir, { recursive: true });
        await writeFile(filepath, buffer);

        const relativePath = `/api/uploads/documents/${filename}`;

        return NextResponse.json({
            filepath: relativePath,
            filename: file.name,
            mimetype: file.type,
            size: file.size,
        });
    });
}
