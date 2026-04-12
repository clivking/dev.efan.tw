import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: any }) {
    noStore();
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id, lid } = await params;

        const target = await prisma.location.findFirst({ where: { id: lid, customerId: id } });
        if (!target) return NextResponse.json({ error: '找不到案場資料' }, { status: 404 });

        await prisma.$transaction([
            prisma.location.updateMany({
                where: { customerId: id },
                data: { isPrimary: false },
            }),
            prisma.location.update({
                where: { id: lid },
                data: { isPrimary: true },
            }),
        ]);

        await writeAudit({
            userId: req.user!.id,
            action: 'status_change',
            tableName: 'locations',
            recordId: lid,
            after: { isPrimary: true },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
