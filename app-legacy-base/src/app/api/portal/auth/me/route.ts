import { NextResponse } from 'next/server';
import { getPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const portalPayload = await getPortalUser();
        if (!portalPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (portalPayload.isAdmin) {
            const adminUser = await prisma.user.findUnique({
                where: { id: portalPayload.portalUserId },
                select: { name: true, email: true },
            });

            return NextResponse.json({
                user: {
                    id: portalPayload.portalUserId,
                    username: portalPayload.username,
                    displayName: adminUser?.name || '管理員',
                    companyName: '管理端模擬登入',
                    isAdmin: true,
                },
            });
        }

        const user = await prisma.portalUser.findUnique({
            where: { id: portalPayload.portalUserId },
            include: {
                customer: {
                    include: {
                        companyNames: { where: { isPrimary: true }, take: 1 },
                    },
                },
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

        if (!user || user.status !== 'active') {
            return NextResponse.json({ error: 'Portal account disabled' }, { status: 403 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                companyName: user.customer.companyNames[0]?.companyName || '',
                contact: user.contact,
            },
        });
    } catch (error) {
        console.error('[Portal Me]', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
