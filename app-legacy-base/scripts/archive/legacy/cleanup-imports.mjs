import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function run() {
    console.log('\u958b\u59cb\u6e05\u7406\u6700\u8fd1\u532f\u5165\u7684\u5ba2\u6236\u8cc7\u6599...');

    const today = new Date();
    const dateStr = today.getFullYear() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');

    const prefix = dateStr + '-C';

    const customersToCleanup = await prisma.customer.findMany({
        where: {
            customerNumber: {
                startsWith: prefix,
            },
        },
        select: { id: true },
    });

    const ids = customersToCleanup.map((customer) => customer.id);

    if (ids.length > 0) {
        await prisma.companyName.deleteMany({ where: { customerId: { in: ids } } });
        await prisma.contact.deleteMany({ where: { customerId: { in: ids } } });
        await prisma.location.deleteMany({ where: { customerId: { in: ids } } });
        const deleted = await prisma.customer.deleteMany({ where: { id: { in: ids } } });
        console.log('\u5df2\u522a\u9664 ' + deleted.count + ' \u7b46\u5ba2\u6236\u8207\u76f8\u95dc\u8cc7\u6599\u3002');
    } else {
        console.log('\u4eca\u5929\u6c92\u6709\u7b26\u5408\u689d\u4ef6\u7684\u532f\u5165\u5ba2\u6236\u9700\u8981\u6e05\u7406\u3002');
    }

    await prisma.dailyCounter.updateMany({
        where: {
            date: {
                equals: new Date(new Date().setHours(0, 0, 0, 0)),
            },
            type: 'customer',
        },
        data: {
            currentValue: 0,
        },
    });

    console.log('\u5df2\u91cd\u8a2d\u4eca\u65e5\u5ba2\u6236\u6d41\u6c34\u865f\u3002');
}

run()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
