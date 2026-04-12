import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id, lid } = await params;
        const body = await req.json();
        const { name, address, isPrimary, notes, sortOrder } = body;

        const old = await prisma.location.findFirst({ where: { id: lid, customerId: id } });
        if (!old) return NextResponse.json({ error: '找不到案場資料' }, { status: 404 });

        const result = await prisma.$transaction(async (tx) => {
            if (isPrimary && !old.isPrimary) {
                await tx.location.updateMany({
                    where: { customerId: id },
                    data: { isPrimary: false },
                });
            }

            const updated = await tx.location.update({
                where: { id: lid },
                data: {
                    name,
                    address,
                    isPrimary: isPrimary !== undefined ? !!isPrimary : old.isPrimary,
                    notes: notes !== undefined ? notes : old.notes,
                    sortOrder: sortOrder !== undefined ? sortOrder : old.sortOrder,
                },
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'update',
                tableName: 'locations',
                recordId: lid,
                before: old as any,
                after: updated as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return updated;
        });

        return NextResponse.json(result);
    });
}

export async function DELETE(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id, lid } = await params;

        const old = await prisma.location.findFirst({ where: { id: lid, customerId: id } });
        if (!old) return NextResponse.json({ error: '找不到案場資料' }, { status: 404 });

        await prisma.location.delete({ where: { id: lid } });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'locations',
            recordId: lid,
            before: old as any,
            after: null,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
