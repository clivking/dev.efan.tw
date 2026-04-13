import { createPrismaClient } from './prisma-client.mjs';
const prisma = createPrismaClient();

async function main() {
    console.log('=== Phase 3 DB Verification ===');

    // 1. Check Customer Numbers
    const customers = await prisma.customer.findMany({
        orderBy: { customerNumber: 'desc' },
        take: 10,
        include: { companyNames: true }
    });
    console.log('\n[1] Recent Customers:');
    customers.forEach(c => {
        const primary = c.companyNames.find(cn => cn.isPrimary)?.companyName || 'N/A';
        console.log(`- ${c.customerNumber}: ${primary} (Deleted: ${c.isDeleted})`);
    });

    // 2. Check Audit Logs
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: true }
    });
    console.log('\n[2] Recent Audit Logs:');
    logs.forEach(l => {
        console.log(`- [${l.createdAt.toISOString()}] ${l.user.name} ${l.action} ${l.tableName} (Record: ${l.recordId})`);
    });

    // 3. Confirm Soft Delete
    const deleted = await prisma.customer.findFirst({
        where: { isDeleted: true }
    });
    console.log(`\n[3] Soft Delete Confirmed: ${deleted ? 'YES' : 'NO'}`);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

