import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();
const DEAL_WON_STATUSES = ['signed', 'construction', 'completed', 'paid'];

async function check() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const quotes = await prisma.quote.findMany({
        where: {
            status: { in: DEAL_WON_STATUSES as any },
            signedAt: { gte: firstDayOfMonth },
            isDeleted: false
        },
        select: {
            id: true,
            quoteNumber: true,
            status: true,
            signedAt: true,
            name: true
        }
    });

    console.log('--- Current Month Signed Quotes ---');
    console.log('First Day of Month:', firstDayOfMonth.toISOString());
    console.log('Count:', quotes.length);
    quotes.forEach(q => {
        console.log(`- ${q.quoteNumber}: ${q.status} (SignedAt: ${q.signedAt?.toISOString()}) - ${q.name || 'Untitled'}`);
    });

    const allStatusQuotes = await prisma.quote.findMany({
        where: {
            isDeleted: false
        },
        select: {
            id: true,
            quoteNumber: true,
            status: true,
            signedAt: true,
            name: true
        }
    });
    console.log('\n--- All Active Quotes with SignedAt ---');
    allStatusQuotes.filter(q => q.signedAt).forEach(q => {
        console.log(`- ${q.quoteNumber}: ${q.status} (SignedAt: ${q.signedAt?.toISOString()}) - ${q.name || 'Untitled'}`);
    });
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    });

