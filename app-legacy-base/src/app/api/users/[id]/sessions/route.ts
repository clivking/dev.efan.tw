import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { revokeUserSessions } from '@/lib/auth-sessions';
import { writeAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return withAdmin(request, async (req) => {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true, name: true },
        });

        if (!user) {
            return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
        }

        const revokedCount = await revokeUserSessions(id);
        await writeAudit({
            userId: req.user!.id,
            action: 'session_revoked',
            tableName: 'auth_sessions',
            recordId: id,
            after: {
                scope: 'admin_all',
                targetUserId: user.id,
                targetUsername: user.username,
                revokedCount,
            },
        });

        return NextResponse.json({ success: true, revokedCount });
    });
}
