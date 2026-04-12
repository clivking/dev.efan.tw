import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: any }) {
    const { id, cid } = await params;
    return withAuth(request, async (req: AuthenticatedRequest) => {

        const target = await prisma.companyName.findFirst({ where: { id: cid, customerId: id } });
        if (!target) return NextResponse.json({ error: '找不到公司資料' }, { status: 404 });

        await prisma.$transaction([
            prisma.companyName.updateMany({
                where: { customerId: id },
                data: { isPrimary: false },
            }),
            prisma.companyName.update({
                where: { id: cid },
                data: { isPrimary: true },
            }),
        ]);

        await writeAudit({
            userId: req.user!.id,
            action: 'status_change',
            tableName: 'company_names',
            recordId: cid,
            after: { isPrimary: true },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
