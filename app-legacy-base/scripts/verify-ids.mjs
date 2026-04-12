import { createPrismaClient } from './prisma-client.mjs';
const prisma = createPrismaClient();

async function run() {
    const customers = await prisma.customer.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: { customerNumber: true, companyNames: { select: { companyName: true }, where: { isPrimary: true } } }
    });
    console.log('--- Random Sample of Migrated Customers ---');
    customers.forEach(c => {
        console.log(`[${c.customerNumber}] ${c.companyNames[0]?.companyName || 'N/A'}`);
    });
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

