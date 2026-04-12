import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id, cid } = await params;

        const target = await prisma.contact.findFirst({ where: { id: cid, customerId: id } });
        if (!target) return NextResponse.json({ error: '找不到聯絡人資料' }, { status: 404 });

        await prisma.$transaction([
            prisma.contact.updateMany({
                where: { customerId: id },
                data: { isPrimary: false },
            }),
            prisma.contact.update({
                where: { id: cid },
                data: { isPrimary: true },
            }),
        ]);

        await writeAudit({
            userId: req.user!.id,
            action: 'status_change',
            tableName: 'contacts',
            recordId: cid,
            after: { isPrimary: true },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
