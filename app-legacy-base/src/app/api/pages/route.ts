import { NextResponse, NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

// GET /api/pages — list all pages (admin, no sections/richContent)
export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const pages = await prisma.page.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
                pageType: true,
                isPublished: true,
                sortOrder: true,
                updatedAt: true,
                updatedBy: true,
            },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(pages);
    });
}
