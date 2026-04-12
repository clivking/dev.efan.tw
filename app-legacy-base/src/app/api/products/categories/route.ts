import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { revalidateProductSite } from '@/lib/revalidate-public';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const allCategories = await prisma.productCategory.findMany({
            include: {
                _count: {
                    select: { products: { where: { isDeleted: false } } }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });

        const formatted = allCategories.map(c => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId,
            sortOrder: c.sortOrder,
            productCount: c._count.products,
            showOnWebsite: c.showOnWebsite,
            seoSlug: c.seoSlug,
            seoTitle: c.seoTitle,
            seoDescription: c.seoDescription,
            specTemplate: c.specTemplate,
        }));

        // Sort hierarchically
        const result: typeof formatted = [];
        const map = new Map<string | null, typeof formatted>();

        formatted.forEach(c => {
            const p = c.parentId || null;
            if (!map.has(p)) map.set(p, []);
            map.get(p)!.push(c);
        });

        const addChildren = (pid: string | null) => {
            const children = map.get(pid) || [];
            children.sort((a, b) => a.sortOrder - b.sortOrder);
            for (const child of children) {
                result.push(child);
                addChildren(child.id);
            }
        };

        addChildren(null);

        return NextResponse.json({ categories: result });
    });
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const body = await request.json();
        const { name, parentId, sortOrder = 0, specTemplate } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const category = await prisma.productCategory.create({
            data: { name, parentId, sortOrder, ...(specTemplate !== undefined && { specTemplate }) }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'create',
            tableName: 'product_categories',
            recordId: category.id,
            after: category as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        revalidateProductSite();

        return NextResponse.json(category);
    });
}
