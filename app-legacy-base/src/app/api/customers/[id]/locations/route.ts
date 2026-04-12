import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const list = await prisma.location.findMany({
            where: { customerId: id },
            orderBy: { sortOrder: 'asc' },
        });
        return NextResponse.json(list);
    });
}

export async function POST(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await req.json();
        const { name, address, isPrimary, notes, sortOrder } = body;

        if (!name || !address) return NextResponse.json({ error: '名稱與地址為必填' }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            if (isPrimary) {
                await tx.location.updateMany({
                    where: { customerId: id },
                    data: { isPrimary: false },
                });
            }

            const created = await tx.location.create({
                data: {
                    customerId: id,
                    name,
                    address,
                    isPrimary: !!isPrimary,
                    notes,
                    sortOrder: sortOrder || 0,
                },
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'create',
                tableName: 'locations',
                recordId: created.id,
                after: created as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return created;
        });

        return NextResponse.json(result);
    });
}
