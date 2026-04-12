import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

/**
 * 模板詳情（含明細 + 最新產品價格）
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await params;
        const template = await prisma.quoteTemplate.findUnique({
            where: { id },
            include: {
                category: true,
                items: {
                    include: {
                        product: true
                    },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const serializedTemplate = {
            ...template,
            items: template.items.map((item: any) => ({
                ...item,
                product: item.product || {
                    id: item.productId || item.id,
                    name: item.name,
                    quoteName: item.name,
                    sellingPrice: item.unitPrice,
                    costPrice: item.costPrice,
                    unit: item.unit,
                    isDeleted: false,
                }
            }))
        };

        return NextResponse.json({ template: serializedTemplate });
    });
}

/**
 * 修改模板名稱/分類
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await request.json();
        const { name, categoryId, notes } = body;

        const before = await prisma.quoteTemplate.findUnique({ where: { id } });
        if (!before) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const updatedTemplate = await prisma.quoteTemplate.update({
            where: { id },
            data: {
                name,
                categoryId,
                notes
            }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'quote_templates',
            recordId: id,
            before: before as any,
            after: updatedTemplate as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(updatedTemplate);
    });
}

/**
 * 軟刪除
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;

        const before = await prisma.quoteTemplate.findUnique({ where: { id } });
        if (!before) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const template = await prisma.quoteTemplate.update({
            where: { id },
            data: { isDeleted: true }
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'quote_templates',
            recordId: id,
            before: before as any,
            after: template as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ success: true });
    });
}
