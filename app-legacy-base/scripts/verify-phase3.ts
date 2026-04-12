import { createPrismaClient } from './prisma-client';
import { getNextNumber } from '../src/lib/daily-counter';
import { cleanPhone } from '../src/lib/phone-format';

const prisma = createPrismaClient();

async function runValidation() {
    console.log('Starting Phase 3 validation...
');

    console.log('--- Validation 1: Customer numbering ---');
    const num2 = await getNextNumber('customer');
    const num3 = await getNextNumber('customer');
    console.log('Generated numbers: ' + num2 + ', ' + num3 + ' (expect ...-C02, ...-C03)');

    const customer = await prisma.customer.create({
        data: {
            customerNumber: num2,
            companyNames: {
                create: {
                    companyName: '驗證公司B',
                    isPrimary: true,
                },
            },
        },
    });

    console.log('
--- Validation 2: Multiple company names ---');
    await prisma.companyName.createMany({
        data: [
            { customerId: customer.id, companyName: '公司2-A', taxId: '11111111', isPrimary: false },
            { customerId: customer.id, companyName: '公司2-B', taxId: '22222222', isPrimary: false },
        ],
    });

    await prisma.$transaction([
        prisma.companyName.updateMany({
            where: { customerId: customer.id },
            data: { isPrimary: false },
        }),
        prisma.companyName.updateMany({
            where: { customerId: customer.id, companyName: '公司2-A' },
            data: { isPrimary: true },
        }),
    ]);

    const primaries = await prisma.companyName.findMany({
        where: { customerId: customer.id, isPrimary: true },
    });
    console.log('Primary companies count: ' + primaries.length + ' (expect 1)');
    console.log('Current primary: ' + primaries[0].companyName + ' (expect \u516c\u53f82-A)');

    console.log('
--- Validation 3: Phone format ---');
    const rawPhone = '0922780141';
    const cleaned = cleanPhone(rawPhone);
    const contact = await prisma.contact.create({
        data: {
            customerId: customer.id,
            name: '驗證聯絡人B',
            mobile: cleaned,
        },
    });
    console.log('Input: ' + rawPhone + ' -> DB value: ' + contact.mobile + ' (expect 0922780141)');

    console.log('
--- Validation 4: Soft delete ---');
    await prisma.customer.update({ where: { id: customer.id }, data: { isDeleted: true } });
    const deletedCheck = await prisma.customer.findUnique({ where: { id: customer.id } });
    console.log('Customer isDeleted: ' + deletedCheck?.isDeleted + ' (expect true)');

    console.log('
--- Validation 5: Audit log ---');
    const logs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
    });
    console.log('Total recent audit logs: ' + logs.length);
    logs.forEach((log) => {
        console.log('- ' + log.action + ' on ' + log.tableName + ' (record: ' + log.recordId + ')');
    });

    console.log('
Validation complete!');
}

runValidation()
    .catch((error) => console.error(error))
    .finally(async () => await prisma.$disconnect());
