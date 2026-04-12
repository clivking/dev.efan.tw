import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { cleanPhone, validateTaxId } from '@/lib/phone-format';

export async function GET(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const list = await prisma.companyName.findMany({
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
        const { companyName, taxId, isPrimary, sortOrder } = body;

        if (!companyName) return NextResponse.json({ error: '公司名稱為必填' }, { status: 400 });
        if (taxId && !validateTaxId(cleanPhone(taxId))) {
            return NextResponse.json({ error: '統編必須為 8 碼數字' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (isPrimary) {
                await tx.companyName.updateMany({
                    where: { customerId: id },
                    data: { isPrimary: false },
                });
            }

            const created = await tx.companyName.create({
                data: {
                    customerId: id,
                    companyName,
                    taxId: taxId ? cleanPhone(taxId) : null,
                    isPrimary: !!isPrimary,
                    sortOrder: sortOrder || 0,
                },
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'create',
                tableName: 'company_names',
                recordId: created.id,
                after: created as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return created;
        });

        return NextResponse.json(result);
    });
}
