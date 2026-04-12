import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ token: string; viewId: string }> }
) {
    try {
        const { token, viewId } = await params;

        // Handle dummy tracking ID
        if (viewId === 'tracking-disabled') {
            return NextResponse.json({ ok: true });
        }

        // 1. Parse body (could be application/json or text/plain because of sendBeacon)
        let body: any = {};
        const contentType = request.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                body = await request.json();
            } else {
                const text = await request.text();
                if (text) body = JSON.parse(text);
            }
        } catch (e) {
            console.warn('Failed to parse body in view duration update:', e);
            return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
        }

        const { durationSeconds } = body;

        if (typeof durationSeconds !== 'number') {
            return NextResponse.json({ error: 'invalid_duration' }, { status: 400 });
        }

        // 2. Quick token check
        const quoteToken = await prisma.quoteToken.findUnique({
            where: { token },
            select: { id: true, isActive: true },
        });

        if (!quoteToken || !quoteToken.isActive) {
            return NextResponse.json({ error: 'invalid_token' }, { status: 410 });
        }

        // 3. Verify viewId belongs to this token
        const viewRecord = await prisma.quoteView.findUnique({
            where: { id: viewId },
            select: { tokenId: true },
        });

        if (!viewRecord || viewRecord.tokenId !== quoteToken.id) {
            return NextResponse.json({ error: 'invalid_view' }, { status: 404 });
        }

        // 4. Update duration
        await prisma.quoteView.update({
            where: { id: viewId },
            data: {
                durationSeconds,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error updating view duration:', error);
        return NextResponse.json(
            { error: 'internal_server_error' },
            { status: 500 }
        );
    }
}
