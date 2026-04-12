const { createPrismaClient } = require('./prisma-client.cjs');
const prisma = createPrismaClient();

async function run() {
    console.log('--- Phase 3 Direct Validation ---');

    try {
        const customer = await prisma.customer.create({
            data: {
                customerNumber: '20260304-C02',
                companyNames: {
                    create: [
                        { companyName: '驗證公司Alpha', taxId: '12345678', isPrimary: true },
                        { companyName: '驗證公司Beta', taxId: '87654321', isPrimary: false },
                    ],
                },
                contacts: {
                    create: { name: '驗證聯絡人X', mobile: '0911222333', isPrimary: true },
                },
            },
            include: { companyNames: true, contacts: true },
        });

        console.log('Created:', customer.customerNumber);
        console.log(
            'Companies:',
            customer.companyNames
                .map((company) => company.companyName + ' (Primary: ' + company.isPrimary + ')')
                .join(', ')
        );
        console.log('Mobile in DB:', customer.contacts[0].mobile);

        await prisma.$transaction([
            prisma.companyName.updateMany({
                where: { customerId: customer.id },
                data: { isPrimary: false },
            }),
            prisma.companyName.updateMany({
                where: {
                    id: customer.companyNames.find((item) => item.companyName === '驗證公司Beta').id,
                },
                data: { isPrimary: true },
            }),
        ]);

        const updated = await prisma.companyName.findFirst({
            where: { customerId: customer.id, isPrimary: true },
        });
        console.log('New Primary:', updated.companyName);

        await prisma.customer.update({
            where: { id: customer.id },
            data: { isDeleted: true },
        });
        const check = await prisma.customer.findUnique({ where: { id: customer.id } });
        console.log('isDeleted:', check.isDeleted);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
