import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAdmin(req, async () => {
        try {
            const { id } = await params;
            const users = await prisma.portalUser.findMany({
                where: { customerId: id },
                orderBy: [{ contact: { isPrimary: 'desc' } }, { createdAt: 'asc' }],
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    contactId: true,
                    contact: {
                        select: {
                            id: true,
                            name: true,
                            title: true,
                            email: true,
                            mobile: true,
                            isPrimary: true,
                        },
                    },
                },
            });

            return NextResponse.json(users);
        } catch (error) {
            console.error('[Admin Portal Users]', error);
            return NextResponse.json({ error: '讀取 portal 帳號失敗。' }, { status: 500 });
        }
    });
}
