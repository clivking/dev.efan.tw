import { createPrismaClient } from './prisma-client.mjs';
const prisma = createPrismaClient();

async function checkQuote() {
    const quote = await prisma.quote.findUnique({
        where: { quoteNumber: '20260305-007' },
        include: { items: true }
    });

    if (!quote) {
        console.log('Quote not found');
        return;
    }

    console.log('Quote:', quote.quoteNumber);
    console.log('Total Items:', quote.items.length);
    quote.items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.name} - Hidden: ${item.isHiddenItem}, Selection: ${item.isSelection}`);
    });
}

checkQuote().catch(console.error).finally(() => prisma.$disconnect());

