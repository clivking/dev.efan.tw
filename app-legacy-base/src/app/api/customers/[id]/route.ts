import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { cleanPhone } from '@/lib/phone-format';
import { DEAL_WON_STATUSES } from '@/lib/quote-status';

export const dynamic = 'force-dynamic';

const DEFAULT_LOCATION_NAME = '地址';

function normalizeLocations(locations: any[] = []) {
    return locations.map((l: any) => ({
        ...l,
        name: (l.name || '').trim() || DEFAULT_LOCATION_NAME,
        address: l.address,
    }));
}

export async function GET(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                companyNames: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
                contacts: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
                locations: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            },
        });

        if (!customer) {
            return NextResponse.json({ error: '找不到客戶' }, { status: 404 });
        }

        const [quoteCount, dealStats, quotes, completionRecordCount] = await Promise.all([
            prisma.quote.count({ where: { customerId: id, isDeleted: false } }),
            prisma.quote.aggregate({
                where: {
                    customerId: id,
                    status: { in: DEAL_WON_STATUSES as any },
                    isDeleted: false
                },
                _count: { id: true },
                _sum: { totalAmount: true }
            }),
            prisma.quote.findMany({
                where: { customerId: id, isDeleted: false },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    quoteNumber: true,
                    name: true,
                    totalAmount: true,
                    status: true,
                    createdAt: true,
                    sentAt: true,
                    completedAt: true,
                    completion_note: true,
                    warrantyStartDate: true,
                    warrantyExpiresAt: true,
                    warrantyMonths: true,
                    area: true,
                    location: { select: { name: true } },
                    companyName: { select: { companyName: true } },
                }
            }),
            prisma.quote.count({
                where: { customerId: id, isDeleted: false, completion_note: { not: null }, NOT: { completion_note: "" } }
            })
        ]);

        const stats = {
            quoteCount,
            dealCount: dealStats._count.id,
            dealTotal: Number(dealStats._sum.totalAmount || 0),
            lastQuoteDate: quotes[0]?.createdAt ? quotes[0].createdAt.toISOString() : null,
            completionRecordCount,
        };

        return NextResponse.json({
            customer: {
                ...customer,
                quotes: quotes,
            },
            stats,
        });
    });
}

export async function PUT(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const body = await req.json();
        const { notes, companyNames = [], contacts = [], locations = [] } = body;
        const normalizedLocations = normalizeLocations(locations);

        const old = await prisma.customer.findUnique({
            where: { id },
            include: { companyNames: true, contacts: true, locations: true }
        });
        if (!old) return NextResponse.json({ error: '找不到客戶' }, { status: 404 });

        const updated = await prisma.$transaction(async (tx) => {
            // 1. Sync Company Names
            const incomingCompanyIds = companyNames.map((c: any) => c.id).filter(Boolean);
            await tx.companyName.deleteMany({
                where: { customerId: id, id: { notIn: incomingCompanyIds } }
            });
            for (const c of companyNames) {
                if (c.id) {
                    await tx.companyName.update({
                        where: { id: c.id },
                        data: {
                            companyName: c.companyName,
                            taxId: c.taxId ? cleanPhone(c.taxId) : null,
                            isPrimary: !!c.isPrimary,
                            sortOrder: c.sortOrder || 0,
                        }
                    });
                } else {
                    await tx.companyName.create({
                        data: {
                            customerId: id,
                            companyName: c.companyName,
                            taxId: c.taxId ? cleanPhone(c.taxId) : null,
                            isPrimary: !!c.isPrimary,
                            sortOrder: c.sortOrder || 0,
                        }
                    });
                }
            }

            // 2. Sync Contacts
            const incomingContactIds = contacts.map((c: any) => c.id).filter(Boolean);
            await tx.contact.deleteMany({
                where: { customerId: id, id: { notIn: incomingContactIds } }
            });
            for (const c of contacts) {
                if (c.id) {
                    await tx.contact.update({
                        where: { id: c.id },
                        data: {
                            name: c.name,
                            mobile: c.mobile ? cleanPhone(c.mobile) : null,
                            phone: c.phone ? cleanPhone(c.phone) : null,
                            title: c.title || null,
                            fax: c.fax ? cleanPhone(c.fax) : null,
                            email: c.email || null,
                            hasLine: !!c.hasLine,
                            isPrimary: !!c.isPrimary,
                            notes: c.notes,
                            sortOrder: c.sortOrder || 0,
                        }
                    });
                } else {
                    await tx.contact.create({
                        data: {
                            customerId: id,
                            name: c.name,
                            mobile: c.mobile ? cleanPhone(c.mobile) : null,
                            phone: c.phone ? cleanPhone(c.phone) : null,
                            title: c.title || null,
                            fax: c.fax ? cleanPhone(c.fax) : null,
                            email: c.email || null,
                            hasLine: !!c.hasLine,
                            isPrimary: !!c.isPrimary,
                            notes: c.notes,
                            sortOrder: c.sortOrder || 0,
                        }
                    });
                }
            }

            // 3. Sync Locations
            const incomingLocationIds = normalizedLocations.map((l: any) => l.id).filter(Boolean);
            await tx.location.deleteMany({
                where: { customerId: id, id: { notIn: incomingLocationIds } }
            });
            for (const l of normalizedLocations) {
                if (l.id) {
                    await tx.location.update({
                        where: { id: l.id },
                        data: {
                            name: l.name,
                            address: l.address,
                            isPrimary: !!l.isPrimary,
                            notes: l.notes,
                            sortOrder: l.sortOrder || 0,
                        }
                    });
                } else {
                    await tx.location.create({
                        data: {
                            customerId: id,
                            name: l.name,
                            address: l.address,
                            isPrimary: !!l.isPrimary,
                            notes: l.notes,
                            sortOrder: l.sortOrder || 0,
                        }
                    });
                }
            }

            // 4. Ensure at least one primary for each
            const updatedCompanies = await tx.companyName.findMany({ where: { customerId: id }, orderBy: { sortOrder: 'asc' } });
            if (updatedCompanies.length > 0 && !updatedCompanies.some(c => c.isPrimary)) {
                await tx.companyName.update({ where: { id: updatedCompanies[0].id }, data: { isPrimary: true } });
            }

            const updatedContacts = await tx.contact.findMany({ where: { customerId: id }, orderBy: { sortOrder: 'asc' } });
            if (updatedContacts.length > 0 && !updatedContacts.some(c => c.isPrimary)) {
                await tx.contact.update({ where: { id: updatedContacts[0].id }, data: { isPrimary: true } });
            }

            const updatedLocations = await tx.location.findMany({ where: { customerId: id }, orderBy: { sortOrder: 'asc' } });
            if (updatedLocations.length > 0 && !updatedLocations.some(l => l.isPrimary)) {
                await tx.location.update({ where: { id: updatedLocations[0].id }, data: { isPrimary: true } });
            }

            // 5. Update Main Customer Record
            return await tx.customer.update({
                where: { id },
                data: { notes },
                include: { companyNames: true, contacts: true, locations: true }
            });
        });

        await writeAudit({
            userId: req.user!.id,
            action: 'update',
            tableName: 'customers',
            recordId: id,
            before: old as any,
            after: updated as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(updated);
    });
}

export async function DELETE(request: NextRequest, { params }: { params: any }) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const deleteQuotes = searchParams.get('deleteQuotes') === 'true';

        const old = await prisma.customer.findUnique({
            where: { id },
            include: {
                companyNames: true, contacts: true, locations: true,
                quotes: { select: { id: true, quoteNumber: true } }
            },
        });
        if (!old) return NextResponse.json({ error: '找不到客戶' }, { status: 404 });

        const quoteIds = old.quotes.map(q => q.id);

        if (deleteQuotes && quoteIds.length > 0) {
            // Delete all quotes and their items
            await prisma.$transaction([
                prisma.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } }),
                prisma.quote.deleteMany({ where: { parentQuoteId: { in: quoteIds } } }),
                prisma.quote.deleteMany({ where: { customerId: id } }),
            ]);
        } else if (quoteIds.length > 0) {
            // Detach quotes from customer (keep as snapshots)
            await prisma.quote.updateMany({
                where: { customerId: id },
                data: { customerId: null, companyNameId: null, locationId: null },
            });
        }

        // Delete customer and related records
        await prisma.$transaction([
            prisma.contactRequest.deleteMany({ where: { customerId: id } }),
            prisma.companyName.deleteMany({ where: { customerId: id } }),
            prisma.contact.deleteMany({ where: { customerId: id } }),
            prisma.location.deleteMany({ where: { customerId: id } }),
            prisma.customer.delete({ where: { id } }),
        ]);

        await writeAudit({
            userId: req.user!.id,
            action: 'delete',
            tableName: 'customers',
            recordId: id,
            before: old as any,
            after: null,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true, deletedQuotes: deleteQuotes ? quoteIds.length : 0 });
    });
}
