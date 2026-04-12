// \u6aa2\u67e5\u806f\u7d61\u4eba\u96fb\u8a71\u6b04\u4f4d\u5167\u5bb9
import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function main() {
    const contacts = await prisma.contact.findMany({
        select: {
            id: true,
            name: true,
            mobile: true,
            phone: true,
            customer: {
                select: {
                    customerNumber: true,
                    companyNames: {
                        where: { isPrimary: true },
                        select: { companyName: true },
                    },
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    console.log('\n=== \u5171 ' + contacts.length + ' \u7b46\u806f\u7d61\u4eba ===\n');

    for (const contact of contacts) {
        const company = contact.customer?.companyNames?.[0]?.companyName || '(\u672a\u586b\u516c\u53f8)';
        console.log('[' + contact.customer?.customerNumber + '] ' + company + ' | ' + contact.name);
        console.log('  mobile: "' + (contact.mobile || '(\u7a7a)') + '"');
        console.log('  phone:  "' + (contact.phone || '(\u7a7a)') + '"');
        console.log('');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
