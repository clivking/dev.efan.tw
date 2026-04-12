import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();

async function main() {
    const settings = [
        {
            key: 'unsigned_reminder_days',
            value: '3',
            type: 'number',
            category: 'reminder',
            description: '\u5831\u50f9\u55ae\u9001\u51fa\u5f8c\u672a\u7c3d\u56de\u8ffd\u8e64\u5929\u6578',
        },
        {
            key: 'warranty_expiry_alert_days',
            value: '30',
            type: 'number',
            category: 'reminder',
            description: '\u4fdd\u56fa\u5230\u671f\u524d\u63d0\u9192\u5929\u6578',
        },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {
                value: setting.value,
                category: setting.category,
                description: setting.description,
            },
            create: setting,
        });
    }

    await prisma.setting.deleteMany({
        where: { key: { in: ['enable_inventory', 'low_stock_warning'] } },
    });

    console.log('Settings updated successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
