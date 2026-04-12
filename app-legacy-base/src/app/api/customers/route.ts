import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getNextNumber } from '@/lib/daily-counter';
import { writeAudit } from '@/lib/audit';
import { cleanPhone } from '@/lib/phone-format';
import { DEAL_WON_STATUSES } from '@/lib/quote-status';

const DEFAULT_LOCATION_NAME = '地址';

function normalizeLocations(locations: any[] = []) {
    return locations.map((l: any) => ({
        ...l,
        name: (l.name || '').trim() || DEFAULT_LOCATION_NAME,
        address: l.address,
    }));
}

export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const search = searchParams.get('search') || '';
        const includeDeleted = searchParams.get('includeDeleted') === 'true';
        const sortBy = searchParams.get('sortBy') || 'lastQuote'; // Default to lastQuote

        const where: any = {
            isDeleted: includeDeleted ? undefined : false,
        };

        if (search) {
            const cleanedSearch = cleanPhone(search);
            where.OR = [
                { customerNumber: { contains: search, mode: 'insensitive' } },
                { companyNames: { some: { companyName: { contains: search, mode: 'insensitive' } } } },
                { contacts: { some: { name: { contains: search, mode: 'insensitive' } } } },
                { locations: { some: { address: { contains: search, mode: 'insensitive' } } } },
            ];
            if (cleanedSearch) {
                where.OR.push(
                    { contacts: { some: { mobile: { contains: cleanedSearch } } } },
                    { contacts: { some: { phone: { contains: cleanedSearch } } } }
                );
            }
        }

        let orderBy: any = [
            { lastQuoteAt: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' }
        ];

        if (sortBy === 'lastDeal') {
            orderBy = [
                { lastDealAt: { sort: 'desc', nulls: 'last' } },
                { createdAt: 'desc' }
            ];
        } else if (sortBy === 'customerNumber') {
            orderBy = { customerNumber: 'desc' };
        }

        console.log('API Customers Query:', { sortBy, orderBy: JSON.stringify(orderBy) });

        const [total, customers] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                include: {
                    companyNames: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
                    contacts: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
                },
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        // Fetch stats for the current page of customers
        const customerIds = customers.map(c => c.id);
        const [quoteCounts, dealStats] = await Promise.all([
            prisma.quote.groupBy({
                by: ['customerId'],
                where: { customerId: { in: customerIds }, isDeleted: false },
                _count: { id: true },
            }),
            prisma.quote.groupBy({
                by: ['customerId'],
                where: {
                    customerId: { in: customerIds },
                    status: { in: DEAL_WON_STATUSES as any },
                    isDeleted: false
                },
                _count: { id: true },
                _sum: { totalAmount: true },
            }),
        ]);

        return NextResponse.json({
            customers: customers.map(c => {
                const quotes = quoteCounts.find(q => q.customerId === c.id);
                const deals = dealStats.find(d => d.customerId === c.id);

                return {
                    id: c.id,
                    customerNumber: c.customerNumber,
                    primaryCompanyName: c.companyNames[0]?.companyName || null,
                    primaryContact: c.contacts[0]?.name || null,
                    primaryContactMobile: c.contacts[0]?.mobile || null,
                    primaryContactPhone: c.contacts[0]?.phone || null,
                    quoteCount: quotes?._count.id || 0,
                    dealCount: deals?._count.id || 0,
                    dealTotal: Number(deals?._sum.totalAmount || 0),
                    lastQuoteDate: c.lastQuoteAt || null,
                    isDeleted: c.isDeleted,
                    createdAt: c.createdAt,
                };
            }),
            total,
            page,
            pageSize
        });
    });
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const body = await request.json();
        const { notes, companyNames = [], contacts = [], locations = [], skipDuplicateCheck = false } = body;
        const normalizedLocations = normalizeLocations(locations);

        // Duplicate Check
        if (!skipDuplicateCheck) {
            const mobileNumbers = contacts.map((c: any) => cleanPhone(c.mobile)).filter(Boolean);
            const companyNamesList = companyNames.map((c: any) => c.companyName).filter(Boolean);

            const duplicates = await prisma.customer.findMany({
                where: {
                    isDeleted: false,
                    OR: [
                        { contacts: { some: { mobile: { in: mobileNumbers } } } },
                        { companyNames: { some: { companyName: { in: companyNamesList } } } },
                    ],
                },
                include: {
                    companyNames: { where: { isPrimary: true }, take: 1 },
                    contacts: { where: { isPrimary: true }, take: 1 },
                }
            });

            if (duplicates.length > 0) {
                return NextResponse.json({
                    duplicates: duplicates.map(d => ({
                        id: d.id,
                        customerNumber: d.customerNumber,
                        primaryCompanyName: d.companyNames[0]?.companyName || null,
                        primaryContact: d.contacts[0]?.name || null,
                    })),
                    message: "發現可能重複的客戶"
                }, { status: 409 });
            }
        }

        const customerNumber = await getNextNumber('customer');

        const customer = await prisma.$transaction(async (tx) => {
            const newCustomer = await tx.customer.create({
                data: {
                    customerNumber,
                    notes,
                    companyNames: {
                        create: companyNames.map((c: any) => ({
                            companyName: c.companyName,
                            taxId: c.taxId ? cleanPhone(c.taxId) : null,
                            isPrimary: !!c.isPrimary,
                            sortOrder: c.sortOrder || 0,
                        })),
                    },
                    contacts: {
                        create: contacts.map((c: any) => ({
                            name: c.name,
                            mobile: c.mobile ? cleanPhone(c.mobile) : null,
                            phone: c.phone ? cleanPhone(c.phone) : null,
                            fax: c.fax ? cleanPhone(c.fax) : null,
                            email: c.email,
                            hasLine: !!c.hasLine,
                            isPrimary: !!c.isPrimary,
                            notes: c.notes,
                            sortOrder: c.sortOrder || 0,
                        })),
                    },
                    locations: {
                        create: normalizedLocations.map((l: any) => ({
                            name: l.name,
                            address: l.address,
                            isPrimary: !!l.isPrimary,
                            notes: l.notes,
                            sortOrder: l.sortOrder || 0,
                        })),
                    },
                },
                include: {
                    companyNames: true,
                    contacts: true,
                    locations: true,
                }
            });

            // Ensure at least one primary for each
            const updatedCompanies = await tx.companyName.findMany({ where: { customerId: newCustomer.id }, orderBy: { sortOrder: 'asc' } });
            if (updatedCompanies.length > 0 && !updatedCompanies.some(c => c.isPrimary)) {
                await tx.companyName.update({ where: { id: updatedCompanies[0].id }, data: { isPrimary: true } });
            }

            const updatedContacts = await tx.contact.findMany({ where: { customerId: newCustomer.id }, orderBy: { sortOrder: 'asc' } });
            if (updatedContacts.length > 0 && !updatedContacts.some(c => c.isPrimary)) {
                await tx.contact.update({ where: { id: updatedContacts[0].id }, data: { isPrimary: true } });
            }

            const updatedLocations = await tx.location.findMany({ where: { customerId: newCustomer.id }, orderBy: { sortOrder: 'asc' } });
            if (updatedLocations.length > 0 && !updatedLocations.some(l => l.isPrimary)) {
                await tx.location.update({ where: { id: updatedLocations[0].id }, data: { isPrimary: true } });
            }

            const finalCustomer = await tx.customer.findUnique({
                where: { id: newCustomer.id },
                include: { companyNames: true, contacts: true, locations: true }
            });

            await writeAudit({
                userId: req.user!.id,
                action: 'create',
                tableName: 'customers',
                recordId: newCustomer.id,
                after: finalCustomer as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return finalCustomer;
        });

        return NextResponse.json(customer);
    });
}
