const { createPrismaClient } = require('./prisma-client.cjs');
const prisma = createPrismaClient();

async function updateDates() {
    console.log('--- \u66f4\u65b0\u5ba2\u6236\u6700\u5f8c\u5831\u50f9\u8207\u6210\u4ea4\u65e5\u671f ---');

    const customers = await prisma.customer.findMany({
        where: { isDeleted: false },
    });

    console.log(`\u5171\u627e\u5230 ${customers.length} \u4f4d\u5ba2\u6236\u3002`);

    let count = 0;
    for (const customer of customers) {
        if (!customer.notes) continue;

        const match = customer.notes.match(/\u5831\u50f9\u7d00\u9304\s*([^\n\r]+)/);
        if (!match) continue;

        const quoteNumbers = match[1].split(',').map((item) => item.trim()).filter(Boolean);
        if (quoteNumbers.length === 0) continue;

        const latestQuote = quoteNumbers.sort().pop();
        const dateMatch = latestQuote.match(/^(\d{4})(\d{2})(\d{2})/);
        if (!dateMatch) continue;

        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const day = parseInt(dateMatch[3], 10);
        const lastDate = new Date(year, month, day, 12, 0, 0);

        await prisma.customer.update({
            where: { id: customer.id },
            data: {
                lastQuoteAt: lastDate,
                lastDealAt: lastDate,
            },
        });
        count++;
    }

    console.log(`\u5df2\u66f4\u65b0 ${count} \u4f4d\u5ba2\u6236\u7684\u65e5\u671f\u8cc7\u6599\u3002`);
    await prisma.$disconnect();
}

updateDates();
