import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getNextNumber } from '@/lib/daily-counter';
import { writeAudit } from '@/lib/audit';
import { cleanPhone } from '@/lib/phone-format';
import { loadWorkbookFromBuffer, worksheetToMatrix } from '@/lib/excel';

export const dynamic = 'force-dynamic';

function asText(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function isTruthy(value: unknown) {
    const normalized = asText(value).toLowerCase();
    return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === '是';
}

function appendGroupedItem(map: Map<string, any>, id: string) {
    if (!map.has(id)) {
        map.set(id, {
            temp_id: id,
            companyNames: [],
            contacts: [],
            locations: [],
            notes: '',
            errors: [],
        });
    }

    return map.get(id);
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'preview';

        if (mode === 'confirm') {
            try {
                const body = await request.json();
                const { data: customersToImport } = body;

                let successCount = 0;
                let failureCount = 0;

                for (const item of customersToImport) {
                    try {
                        const customerNumber = await getNextNumber('customer');

                        await prisma.$transaction(async (tx) => {
                            await tx.customer.create({
                                data: {
                                    customerNumber,
                                    notes: item.notes,
                                    companyNames: {
                                        create: item.companyNames.map((c: any) => ({
                                            companyName: c.company_name,
                                            taxId: c.vat_number ? cleanPhone(String(c.vat_number)) : null,
                                            isPrimary: !!c.is_primary,
                                        })),
                                    },
                                    contacts: {
                                        create: item.contacts.map((c: any) => ({
                                            name: c.name,
                                            mobile: c.phone ? cleanPhone(String(c.phone)) : null,
                                            email: c.email,
                                            isPrimary: !!c.is_primary,
                                            notes: c.title ? `職稱：${c.title}` : undefined,
                                        })),
                                    },
                                    locations: {
                                        create: item.locations.map((l: any) => ({
                                            name: l.name || '主要地址',
                                            address: l.address,
                                            isPrimary: !!l.is_primary,
                                        })),
                                    },
                                }
                            });
                        });
                        successCount++;
                    } catch (err) {
                        console.error('Confirm import error:', err);
                        failureCount++;
                    }
                }

                await writeAudit({
                    userId: req.user!.id,
                    action: 'import',
                    tableName: 'customers',
                    recordId: 'n/a' as any,
                    after: { successCount, failureCount } as any,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                });

                return NextResponse.json({ successCount, failureCount });
            } catch (err) {
                console.error('Confirm import payload error:', err);
                return NextResponse.json({ error: 'Payload error' }, { status: 400 });
            }
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const workbook = await loadWorkbookFromBuffer(await file.arrayBuffer());
        const groupedMap = new Map<string, any>();
        let errorCount = 0;

        if (workbook.worksheets.length >= 3) {
            const [mainSheet, companySheet, contactSheet, locationSheet] = workbook.worksheets;

            if (mainSheet) {
                const rows = worksheetToMatrix(mainSheet).slice(1);
                rows.forEach((row) => {
                    const id = asText(row[0]);
                    if (!id) return;

                    const current = appendGroupedItem(groupedMap, id);
                    const noteParts = row.slice(1).map(asText).filter(Boolean);
                    if (noteParts.length > 0) {
                        current.notes = noteParts.join(' | ');
                    }
                });
            }

            const companyRows = worksheetToMatrix(companySheet).slice(1);
            companyRows.forEach((row) => {
                const id = asText(row[0]);
                const companyName = asText(row[1]);
                if (!id || !companyName) return;

                const current = appendGroupedItem(groupedMap, id);
                current.companyNames.push({
                    company_name: companyName,
                    vat_number: asText(row[2]) || null,
                    is_primary: isTruthy(row[3]) || current.companyNames.length === 0,
                });
            });

            const contactRows = worksheetToMatrix(contactSheet).slice(1);
            contactRows.forEach((row) => {
                const id = asText(row[0]);
                const name = asText(row[1]);
                if (!id || !name) return;

                const current = appendGroupedItem(groupedMap, id);
                current.contacts.push({
                    name,
                    phone: asText(row[2] || row[3]) || null,
                    email: asText(row[4]) || null,
                    title: asText(row[5]) || null,
                    is_primary: isTruthy(row[6]) || current.contacts.length === 0,
                });
            });

            if (locationSheet) {
                const locationRows = worksheetToMatrix(locationSheet).slice(1);
                locationRows.forEach((row) => {
                    const id = asText(row[0]);
                    const address = asText(row[2] || row[1]);
                    if (!id || !address) return;

                    const current = appendGroupedItem(groupedMap, id);
                    current.locations.push({
                        name: asText(row[1]) || '未命名地點',
                        address,
                        is_primary: isTruthy(row[3]) || current.locations.length === 0,
                    });
                });
            }
        } else {
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                return NextResponse.json({ error: 'Worksheet not found' }, { status: 400 });
            }

            const rows = worksheetToMatrix(worksheet);
            const headers = rows[0]?.map(asText) || [];

            const findIndex = (candidates: string[], fallback: number) => {
                const idx = headers.findIndex((header) =>
                    candidates.some((candidate) => header.toLowerCase().includes(candidate.toLowerCase()))
                );
                return idx >= 0 ? idx : fallback;
            };

            const idxId = findIndex(['temp id', 'id'], 0);
            const idxCompany = findIndex(['company', '公司'], 1);
            const idxVat = findIndex(['vat', 'tax'], 2);
            const idxContact = findIndex(['contact', '聯絡'], 3);
            const idxPhone = findIndex(['phone', 'mobile', '電話'], 4);
            const idxEmail = findIndex(['email', 'mail'], 5);
            const idxAddress = findIndex(['address', '地址'], 6);
            const idxNotes = findIndex(['notes', '備註'], 7);

            rows.slice(1).forEach((row, index) => {
                const rawId = row[idxId] || `ROW-${index + 1}`;
                const tempId = asText(rawId);

                const current = appendGroupedItem(groupedMap, tempId);
                if (!current.notes) {
                    current.notes = asText(row[idxNotes]);
                }

                const companyName = asText(row[idxCompany]);
                if (companyName) {
                    current.companyNames.push({
                        company_name: companyName,
                        vat_number: asText(row[idxVat]) || null,
                        is_primary: current.companyNames.length === 0,
                    });
                }

                const contactName = asText(row[idxContact]);
                if (contactName) {
                    current.contacts.push({
                        name: contactName,
                        phone: asText(row[idxPhone]) || null,
                        email: asText(row[idxEmail]) || null,
                        is_primary: current.contacts.length === 0,
                    });
                }

                const address = asText(row[idxAddress]);
                if (address) {
                    current.locations.push({
                        address,
                        is_primary: current.locations.length === 0,
                    });
                }
            });
        }

        const previewData = Array.from(groupedMap.values()).map(item => {
            if (item.companyNames.length === 0 && item.contacts.length === 0) {
                item.errors.push('至少需要一筆公司名稱或聯絡人資料。');
                errorCount++;
            }
            return item;
        });

        return NextResponse.json({ previewData, errorCount });
    });
}
