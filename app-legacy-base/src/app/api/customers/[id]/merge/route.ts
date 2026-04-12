import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id: targetId } = await params;
        const body = await req.json();
        const { sourceCustomerId } = body;

        if (!sourceCustomerId || sourceCustomerId === targetId) {
            return NextResponse.json({ error: '無效的來源客戶' }, { status: 400 });
        }

        const [source, target] = await Promise.all([
            prisma.customer.findUnique({ where: { id: sourceCustomerId } }),
            prisma.customer.findUnique({ where: { id: targetId } }),
        ]);

        if (!source || !target) {
            return NextResponse.json({ error: '找不到對應客戶' }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.companyName.updateMany({
                where: { customerId: sourceCustomerId },
                data: { customerId: targetId, isPrimary: false },
            });

            await tx.contact.updateMany({
                where: { customerId: sourceCustomerId },
                data: { customerId: targetId, isPrimary: false },
            });

            await tx.location.updateMany({
                where: { customerId: sourceCustomerId },
                data: { customerId: targetId, isPrimary: false },
            });

            await tx.contactRequest.updateMany({
                where: { customerId: sourceCustomerId },
                data: { customerId: targetId },
            });

            await tx.customer.update({
                where: { id: sourceCustomerId },
                data: { isDeleted: true, notes: `(Merged into ${target.customerNumber}) ${source.notes || ''}` },
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'delete',
                tableName: 'customers',
                recordId: sourceCustomerId,
                after: { mergedInto: targetId },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return { success: true };
        });

        return NextResponse.json(result);
    });
}
