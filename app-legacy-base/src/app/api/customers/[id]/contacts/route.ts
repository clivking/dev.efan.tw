import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { cleanPhone } from '@/lib/phone-format';

export async function GET(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const list = await prisma.contact.findMany({
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
        const { name, mobile, phone, title, fax, email, hasLine, isPrimary, notes, sortOrder } = body;

        if (!name) return NextResponse.json({ error: '姓名為必填' }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            if (isPrimary) {
                await tx.contact.updateMany({
                    where: { customerId: id },
                    data: { isPrimary: false },
                });
            }

            const created = await tx.contact.create({
                data: {
                    customerId: id,
                    name,
                    mobile: mobile ? cleanPhone(mobile) : null,
                    phone: phone ? cleanPhone(phone) : null,
                    title: title || null,
                    fax: fax ? cleanPhone(fax) : null,
                    email: email || null,
                    hasLine: !!hasLine,
                    isPrimary: !!isPrimary,
                    notes,
                    sortOrder: sortOrder || 0,
                },
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'create',
                tableName: 'contacts',
                recordId: created.id,
                after: created as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return created;
        });

        return NextResponse.json(result);
    });
}
