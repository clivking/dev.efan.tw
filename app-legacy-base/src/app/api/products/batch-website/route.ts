import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { revalidateProductSite } from '@/lib/revalidate-public';

// POST — 批量更新產品的 showOnWebsite 欄位
export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const body = await request.json();
        const { ids, showOnWebsite } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ids array required' }, { status: 400 });
        }

        if (typeof showOnWebsite !== 'boolean') {
            return NextResponse.json({ error: 'showOnWebsite boolean required' }, { status: 400 });
        }

        // If publishing, check all products have seo_slug
        if (showOnWebsite) {
            const productsWithoutSlug = await prisma.product.findMany({
                where: { id: { in: ids }, seoSlug: null },
                select: { id: true, name: true },
            });
            if (productsWithoutSlug.length > 0) {
                const names = productsWithoutSlug.map(p => p.name).join(', ');
                return NextResponse.json({
                    error: `以下產品尚未設定 SEO 網址，無法發佈：${names}`,
                }, { status: 400 });
            }
        }

        const result = await prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { showOnWebsite },
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'products',
            recordId: ids.join(','),
            after: { showOnWebsite, count: result.count } as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        revalidateProductSite();

        return NextResponse.json({
            success: true,
            count: result.count,
            message: showOnWebsite
                ? `${result.count} 個產品已發佈到前台`
                : `${result.count} 個產品已從前台下架`,
        });
    });
}
