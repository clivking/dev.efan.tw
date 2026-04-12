import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { cleanPhone, validateTaxId } from '@/lib/phone-format';

export async function PUT(request: NextRequest, { params }: { params: any }) {
    const { id, cid } = await params;
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const body = await req.json();
        const { companyName, taxId, isPrimary, sortOrder } = body;

        const old = await prisma.companyName.findFirst({ where: { id: cid, customerId: id } });
        if (!old) return NextResponse.json({ error: '找不到公司資料' }, { status: 404 });

        if (taxId && !validateTaxId(cleanPhone(taxId))) {
            return NextResponse.json({ error: '統編必須為 8 碼數字' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (isPrimary && !old.isPrimary) {
                await tx.companyName.updateMany({
                    where: { customerId: id },
                    data: { isPrimary: false },
                });
            }

            const updated = await tx.companyName.update({
                where: { id: cid },
                data: {
                    companyName,
                    taxId: taxId ? cleanPhone(taxId) : null,
                    isPrimary: isPrimary !== undefined ? !!isPrimary : old.isPrimary,
                    sortOrder: sortOrder !== undefined ? sortOrder : old.sortOrder,
                },
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'update',
                tableName: 'company_names',
                recordId: cid,
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
        const { id, cid } = await params;

        const old = await prisma.companyName.findFirst({ where: { id: cid, customerId: id } });
        if (!old) return NextResponse.json({ error: '找不到公司資料' }, { status: 404 });

        await prisma.companyName.delete({ where: { id: cid } });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'company_names',
            recordId: cid,
            before: old as any,
            after: null,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
