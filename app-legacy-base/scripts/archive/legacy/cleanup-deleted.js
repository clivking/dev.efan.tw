const { createPrismaClient } = require('./prisma-client.cjs');
const prisma = createPrismaClient();

async function main() {
    const deleted = await prisma.customer.findMany({
        where: { isDeleted: true },
        include: {
            companyNames: { select: { companyName: true } },
            contacts: { select: { name: true } },
            quotes: { select: { id: true, quoteNumber: true } },
        },
    });

    console.log(`Found ${deleted.length} soft-deleted customer(s):\n`);

    for (const customer of deleted) {
        const names = customer.companyNames.map((item) => item.companyName).join(', ') || '(no company)';
        const contacts = customer.contacts.map((item) => item.name).join(', ') || '(no contact)';
        console.log(`  ${customer.customerNumber} | ${names} | ${contacts}`);
        console.log(`    Quotes: ${customer.quotes.length}`);

        const quoteIds = customer.quotes.map((quote) => quote.id);

        if (quoteIds.length > 0) {
            await prisma.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } });
            await prisma.quote.deleteMany({ where: { parentQuoteId: { in: quoteIds } } });
        }

        await prisma.quote.deleteMany({ where: { customerId: customer.id } });
        await prisma.contactRequest.deleteMany({ where: { customerId: customer.id } });
        await prisma.companyName.deleteMany({ where: { customerId: customer.id } });
        await prisma.contact.deleteMany({ where: { customerId: customer.id } });
        await prisma.location.deleteMany({ where: { customerId: customer.id } });
        await prisma.customer.delete({ where: { id: customer.id } });

        console.log('    Permanently deleted!\n');
    }

    if (deleted.length === 0) {
        console.log('  No soft-deleted customers found. Database is clean!');
    }

    console.log('\nCleanup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
