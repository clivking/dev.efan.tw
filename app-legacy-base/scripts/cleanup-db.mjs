import bcryptjs from 'bcryptjs';
import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function main() {
    console.log('\u958b\u59cb\u6e05\u7406\u6e2c\u8a66\u8cc7\u6599...');

    await prisma.auditLog.deleteMany({});
    console.log('  \u5df2\u6e05\u7a7a Audit log');

    await prisma.quoteItem.deleteMany({});
    console.log('  \u5df2\u6e05\u7a7a\u5831\u50f9\u660e\u7d30');

    await prisma.quote.updateMany({ data: { parentQuoteId: null } });
    await prisma.quote.deleteMany({});
    console.log('  \u5df2\u6e05\u7a7a\u5831\u50f9\u8cc7\u6599');

    await prisma.templateItem.deleteMany({});
    await prisma.quoteTemplate.deleteMany({});
    console.log('  \u5df2\u6e05\u7a7a\u5831\u50f9\u6a21\u677f');

    await prisma.bundleItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.productCategory.deleteMany({});
    console.log('  \u5df2\u6e05\u7a7a\u7522\u54c1\u8207\u5206\u985e');

    await prisma.contactRequest.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.companyName.deleteMany({});
    await prisma.customer.deleteMany({});
    console.log('  \u5df2\u6e05\u7a7a\u5ba2\u6236\u8207\u76f8\u95dc\u8cc7\u6599');

    await prisma.dailyCounter.deleteMany({});
    console.log('  \u5df2\u6e05\u7a7a\u6bcf\u65e5\u6d41\u6c34\u865f');

    await prisma.user.deleteMany({
        where: { username: { notIn: ['cliv', 'yuny'] } },
    });

    const clivPass = await bcryptjs.hash('0982', 12);
    await prisma.user.upsert({
        where: { username: 'cliv' },
        update: { passwordHash: clivPass, name: '\u9ec3\u79be\u9706', role: 'admin' },
        create: { username: 'cliv', passwordHash: clivPass, name: '\u9ec3\u79be\u9706', role: 'admin' },
    });
    console.log('  \u5df2\u91cd\u5efa\u7ba1\u7406\u54e1 cliv');

    const yunyPass = await bcryptjs.hash('0980', 12);
    await prisma.user.upsert({
        where: { username: 'yuny' },
        update: { passwordHash: yunyPass, name: 'Yuny', role: 'admin' },
        create: { username: 'yuny', passwordHash: yunyPass, name: 'Yuny', role: 'admin' },
    });
    console.log('  \u5df2\u91cd\u5efa\u7ba1\u7406\u54e1 yuny');

    console.log('\u8cc7\u6599\u6e05\u7406\u5b8c\u6210');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
