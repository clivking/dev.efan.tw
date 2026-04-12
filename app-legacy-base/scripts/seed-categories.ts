import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();

async function main() {
    const categories = [
        '\u9580\u7981',
        '\u76e3\u8996',
        '\u96fb\u8a71',
        '\u7db2\u8def',
        '\u5176\u4ed6',
    ];

    for (const [index, name] of categories.entries()) {
        const existing = await prisma.productCategory.findFirst({ where: { name } });

        if (existing) {
            await prisma.productCategory.update({
                where: { id: existing.id },
                data: { sortOrder: index },
            });
            continue;
        }

        await prisma.productCategory.create({
            data: { name, sortOrder: index },
        });
    }

    console.log('\u7522\u54c1\u5206\u985e\u521d\u59cb\u5316\u5b8c\u6210');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
