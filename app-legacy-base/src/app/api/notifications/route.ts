import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
    return withAdmin(request, async () => {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const [total, notifications] = await Promise.all([
            prisma.notification.count(),
            prisma.notification.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return NextResponse.json({
            notifications,
            total,
            page,
            pageSize
        });
    });
}
