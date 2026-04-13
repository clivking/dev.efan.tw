import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();

async function main() {
    const existing = await prisma.setting.findUnique({
        where: { key: 'site_title_suffix' },
    });

    if (existing) {
        console.log('site_title_suffix \u5df2\u5b58\u5728\uff1a' + existing.value);
    } else {
        await prisma.setting.create({
            data: {
                key: 'site_title_suffix',
                value: '\uff5c\u4e00\u5e06\u5b89\u5168\u6574\u5408',
                type: 'string',
                category: 'company',
                description: '\u7db2\u7ad9 title \u5f8c\u7db4',
            },
        });
        console.log('\u5df2\u5efa\u7acb site_title_suffix = \uff5c\u4e00\u5e06\u5b89\u5168\u6574\u5408');
    }

    await prisma.$disconnect();
}

main();
