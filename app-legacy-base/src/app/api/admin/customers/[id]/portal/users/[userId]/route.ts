import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id, userId } = await params;
            const { status } = await req.json();

            if (!['active', 'disabled'].includes(status)) {
                return NextResponse.json({ error: '無效的狀態值。' }, { status: 400 });
            }

            const existing = await prisma.portalUser.findFirst({
                where: {
                    id: userId,
                    customerId: id,
                },
            });

            if (!existing) {
                return NextResponse.json({ error: '找不到入口網站使用者。' }, { status: 404 });
            }

            const user = await prisma.portalUser.update({
                where: { id: userId },
                data: { status },
                include: {
                    contact: {
                        select: {
                            id: true,
                            name: true,
                            title: true,
                            email: true,
                            mobile: true,
                        },
                    },
                },
            });

            return NextResponse.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    status: user.status,
                    contact: user.contact,
                },
            });
        } catch (error) {
            console.error('[Admin Portal User Status]', error);
            return NextResponse.json({ error: '無法更新入口網站使用者狀態。' }, { status: 500 });
        }
    });
}
