import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// GET: serve download image (public)
export async function GET(req: NextRequest) {
    try {
        const imagePath = req.nextUrl.searchParams.get('path');
        if (!imagePath) {
            return NextResponse.json({ error: '未指定圖片' }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'public', imagePath);

        // Prevent directory traversal
        if (!filePath.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
            return NextResponse.json({ error: '不允許的路徑' }, { status: 403 });
        }

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: '圖片不存在' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap: Record<string, string> = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.gif': 'image/gif',
            '.webp': 'image/webp', '.svg': 'image/svg+xml',
        };
        const contentType = mimeMap[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('[Portal Download Image]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}
