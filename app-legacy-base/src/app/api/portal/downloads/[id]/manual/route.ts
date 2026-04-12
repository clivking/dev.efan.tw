import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

// GET: download manual PDF (public)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const download = await prisma.portalDownload.findFirst({
            where: { id, isPublished: true },
        });

        if (!download || !download.manualPath) {
            return NextResponse.json({ error: '說明書不存在' }, { status: 404 });
        }

        const filePath = path.join(process.cwd(), 'public', download.manualPath);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: '檔案不存在' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const downloadName = path.basename(download.manualPath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${encodeURIComponent(downloadName)}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('[Portal Download Manual]', error);
        return NextResponse.json({ error: '系統錯誤' }, { status: 500 });
    }
}
