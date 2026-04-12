import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { writeAudit } from '@/lib/audit';
import { worksheetToMatrix, loadWorkbookFromBuffer } from '@/lib/excel';

export const dynamic = 'force-dynamic';

function toNumber(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === 'yes' || normalized === '1';
    }
    return false;
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const mode = formData.get('mode') as string;
        const dataStr = formData.get('data') as string;

        if (mode === 'confirm' && dataStr) {
            const productsToImport = JSON.parse(dataStr);
            let successCount = 0;
            let errorCount = 0;

            for (const item of productsToImport) {
                try {
                    let category = await prisma.productCategory.findFirst({
                        where: { name: item.categoryName }
                    });

                    if (!category) {
                        category = await prisma.productCategory.create({
                            data: { name: item.categoryName }
                        });
                    }

                    await prisma.product.create({
                        data: {
                            categoryId: category.id,
                            brand: item.brand,
                            model: item.model,
                            name: item.name,
                            description: item.description,
                            quoteName: item.quoteName,
                            quoteDesc: item.quoteDesc,
                            type: (item.type || 'single') as any,
                            unit: item.unit,
                            costPrice: item.costPrice || 0,
                            marketPrice: item.marketPrice,
                            sellingPrice: item.sellingPrice || 0,
                            repairPrice: item.repairPrice,
                            isHiddenItem: item.isHiddenItem === true || item.isHiddenItem === 'TRUE',
                            notes: item.notes
                        }
                    });
                    successCount++;
                } catch (err) {
                    console.error('Import error for item:', item.name, err);
                    errorCount++;
                }
            }

            await writeAudit({
                userId: req.user!.id,
                action: 'import',
                tableName: 'products',
                recordId: 'n/a' as any,
                after: { successCount, errorCount } as any,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            });

            return NextResponse.json({ successCount, errorCount });
        }

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const workbook = await loadWorkbookFromBuffer(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return NextResponse.json({ error: 'Worksheet not found' }, { status: 400 });
        }

        const rows = worksheetToMatrix(worksheet).slice(1);
        const previewData = rows
            .filter((row) => row.some((cell) => cell !== null && cell !== ''))
            .map((row) => ({
                categoryName: String(row[0] || '\u672a\u5206\u985e'),
                brand: row[1] ? String(row[1]) : '',
                model: row[2] ? String(row[2]) : '',
                name: row[3] ? String(row[3]) : '',
                description: row[4] ? String(row[4]) : '',
                quoteName: row[5] ? String(row[5]) : '',
                quoteDesc: row[6] ? String(row[6]) : '',
                type: row[7] === '\u7d44\u5408\u5305' || row[7] === 'bundle' ? 'bundle' : 'single',
                unit: row[8] ? String(row[8]) : '',
                costPrice: toNumber(row[9]) ?? 0,
                marketPrice: toNumber(row[10]),
                sellingPrice: toNumber(row[11]) ?? 0,
                repairPrice: toNumber(row[12]),
                isHiddenItem: toBoolean(row[13]),
                notes: row[14] ? String(row[14]) : '',
            }));

        return NextResponse.json({ previewData });
    });
}
