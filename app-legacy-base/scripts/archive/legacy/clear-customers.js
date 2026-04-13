const { createPrismaClient } = require('./prisma-client.cjs');
const prisma = createPrismaClient();

async function main() {
    console.log('\u958b\u59cb\u6e05\u7a7a\u5ba2\u6236\u8207\u76f8\u95dc\u8cc7\u6599...');

    try {
        const quoteCount = await prisma.quote.count();
        if (quoteCount > 0) {
            console.log(`\u767c\u73fe ${quoteCount} \u7b46\u5831\u50f9\u8cc7\u6599\uff0c\u5148\u6e05\u7a7a\u5831\u50f9\u76f8\u95dc\u8cc7\u6599...`);
            await prisma.quoteItem.deleteMany({});
            await prisma.quoteContact.deleteMany({});
            await prisma.quote.deleteMany({});
        }

        await prisma.contactRequest.deleteMany({});
        await prisma.companyName.deleteMany({});
        await prisma.contact.deleteMany({});
        await prisma.location.deleteMany({});
        await prisma.customer.deleteMany({});

        await prisma.dailyCounter.deleteMany({
            where: { type: 'CUSTOMER' },
        });

        console.log('\u5ba2\u6236\u8cc7\u6599\u5df2\u6e05\u7a7a\u5b8c\u6210\u3002');
    } catch (error) {
        console.error('\u6e05\u7a7a\u8cc7\u6599\u6642\u767c\u751f\u932f\u8aa4\uff1a', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
