import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

/**
 * 列出所有模板
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const { searchParams } = new URL(request.url);
        const includeDeleted = searchParams.get('includeDeleted') === 'true';

        const templates = await prisma.quoteTemplate.findMany({
            where: {
                isDeleted: includeDeleted ? undefined : false
            },
            include: {
                category: true,
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ templates });
    });
}
