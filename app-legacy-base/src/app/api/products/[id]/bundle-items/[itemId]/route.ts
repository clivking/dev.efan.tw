import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string, itemId: string }> }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id, itemId } = await params;

        const before = await prisma.bundleItem.findUnique({
            where: { id: itemId, bundleId: id }
        });

        if (!before) {
            return NextResponse.json({ error: 'Bundle item not found' }, { status: 404 });
        }

        await prisma.bundleItem.delete({ where: { id: itemId } });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'bundle_items',
            recordId: itemId,
            before: before as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
