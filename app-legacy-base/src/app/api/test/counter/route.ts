export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { getNextNumber } from '@/lib/daily-counter';

export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        const { type } = await request.json();
        if (type !== 'customer' && type !== 'quote') {
            return NextResponse.json({ error: 'type must be customer or quote' }, { status: 400 });
        }
        const number = await getNextNumber(type);
        return NextResponse.json({ number, type });
    });
}
