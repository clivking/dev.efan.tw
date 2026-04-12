import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { cleanPhone } from '@/lib/phone-format';

export async function PUT(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id, cid } = await params;
        const body = await req.json();
        const { name, mobile, phone, title, fax, email, hasLine, isPrimary, notes, sortOrder } = body;

        const old = await prisma.contact.findFirst({ where: { id: cid, customerId: id } });
        if (!old) return NextResponse.json({ error: '找不到聯絡人資料' }, { status: 404 });

        const result = await prisma.$transaction(async (tx) => {
            if (isPrimary && !old.isPrimary) {
                await tx.contact.updateMany({
                    where: { customerId: id },
                    data: { isPrimary: false },
                });
            }

            const updated = await tx.contact.update({
                where: { id: cid },
                data: {
                    name: name !== undefined ? name : old.name,
                    mobile: mobile !== undefined ? (mobile ? cleanPhone(mobile) : null) : old.mobile,
                    phone: phone !== undefined ? (phone ? cleanPhone(phone) : null) : old.phone,
                    title: title !== undefined ? (title || null) : old.title,
                    fax: fax !== undefined ? (fax ? cleanPhone(fax) : null) : old.fax,
                    email: email !== undefined ? (email || null) : old.email,
                    hasLine: hasLine !== undefined ? !!hasLine : old.hasLine,
                    isPrimary: isPrimary !== undefined ? !!isPrimary : old.isPrimary,
                    notes: notes !== undefined ? notes : old.notes,
                    sortOrder: sortOrder !== undefined ? sortOrder : old.sortOrder,
                },
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'update',
                tableName: 'contacts',
                recordId: cid,
                before: old as any,
                after: updated as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return updated;
        });

        return NextResponse.json(result);
    });
}

export async function DELETE(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id, cid } = await params;

        const old = await prisma.contact.findFirst({ where: { id: cid, customerId: id } });
        if (!old) return NextResponse.json({ error: '找不到聯絡人資料' }, { status: 404 });

        await prisma.contact.delete({ where: { id: cid } });

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'contacts',
            recordId: cid,
            before: old as any,
            after: null,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    });
}
