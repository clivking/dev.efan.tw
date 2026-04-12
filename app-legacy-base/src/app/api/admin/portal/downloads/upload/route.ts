import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';
import { withAdmin } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 200 * 1024 * 1024; // 200MB

async function fileExists(fp: string): Promise<boolean> {
    try { await access(fp); return true; } catch { return false; }
}

export async function POST(req: NextRequest) {
    return withAdmin(req, async () => {
        try {
            const formData = await req.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            if (file.size > MAX_SIZE) {
                return NextResponse.json({ error: 'File size exceeds 200MB limit' }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'downloads');
            await mkdir(uploadDir, { recursive: true });

            const originalName = file.name;
            const ext = path.extname(originalName);
            const base = path.basename(originalName, ext);
            let filename = originalName;
            let counter = 1;

            while (await fileExists(path.join(uploadDir, filename))) {
                filename = `${base}(${counter})${ext}`;
                counter++;
            }

            await writeFile(path.join(uploadDir, filename), buffer);

            return NextResponse.json({
                filePath: `/uploads/downloads/${filename}`,
                originalName: file.name,
                fileSize: file.size,
            });
        } catch (error) {
            console.error('[Portal Download Upload]', error);
            return NextResponse.json({ error: 'Failed to upload download file' }, { status: 500 });
        }
    });
}
