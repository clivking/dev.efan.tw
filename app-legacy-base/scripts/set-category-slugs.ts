import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();

const SLUG_MAP: Record<string, string> = {
    '\u9580\u7981': 'access-control',
    '\u76e3\u8996': 'surveillance',
    '\u96fb\u8a71': 'phone-system',
    '\u7db2\u8def': 'network',
    '\u5176\u4ed6': 'other',
    '\u8b80\u5361\u6a5f': 'reader',
    '\u96fb\u78c1\u9396': 'electromagnetic-lock',
    '\u9580\u7981\u4e3b\u6a5f': 'access-controller',
    '\u9580\u7981\u914d\u4ef6': 'access-accessories',
    '\u651d\u5f71\u6a5f': 'camera',
    '\u9304\u5f71\u4e3b\u6a5f': 'dvr-nvr',
    '\u76e3\u8996\u914d\u4ef6': 'surveillance-accessories',
    '\u96fb\u8a71\u4e3b\u6a5f': 'pbx',
    '\u96fb\u8a71\u6a5f': 'phone',
    '\u96fb\u8a71\u914d\u4ef6': 'phone-accessories',
    '\u7db2\u8def\u4ea4\u63db\u5668': 'switch',
    '\u7db2\u8def\u914d\u4ef6': 'network-accessories',
    '\u5c0d\u8b1b\u6a5f': 'intercom',
    '\u9580\u9234': 'doorbell',
    '\u5361\u7247': 'key-card',
    '\u9059\u63a7\u5668': 'remote',
    '\u96fb\u6e90\u4f9b\u61c9\u5668': 'power-supply',
    '\u7dda\u6750': 'cable',
    '\u5176\u4ed6\u914d\u4ef6': 'other-accessories',
    '\u96fb\u5b50\u9396': 'electronic-lock',
    '\u51fa\u9580\u6309\u9215': 'exit-button',
    '\u4e94\u91d1': 'hardware',
    '\u5de5\u8cc7': 'labor',
};

async function main() {
    const categories = await prisma.productCategory.findMany({
        select: { id: true, name: true, seoSlug: true, parentId: true },
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    });

    console.log('\u76ee\u524d\u5206\u985e\u5217\u8868\uff1a');
    for (const category of categories) {
        const mappedSlug = SLUG_MAP[category.name];
        const status = category.seoSlug
            ? '\u5df2\u6709 slug\uff1a' + category.seoSlug
            : mappedSlug
                ? '\u5f85\u88dc slug\uff1a' + mappedSlug
                : '\u5c1a\u672a\u5efa\u7acb\u5c0d\u61c9';

        console.log('  ' + (category.parentId ? '\u5b50\u5206\u985e ' : '') + category.name + ' -> ' + status);
    }

    let updated = 0;
    for (const category of categories) {
        if (category.seoSlug) continue;

        const mappedSlug = SLUG_MAP[category.name];
        if (!mappedSlug) {
            console.log('\u7565\u904e\u672a\u5c0d\u61c9\u5206\u985e\uff1a' + category.name);
            continue;
        }

        await prisma.productCategory.update({
            where: { id: category.id },
            data: { seoSlug: mappedSlug },
        });
        console.log('\u5df2\u66f4\u65b0\u5206\u985e slug\uff1a' + category.name + ' -> ' + mappedSlug);
        updated++;
    }

    console.log('\u5b8c\u6210\uff0c\u5171\u66f4\u65b0 ' + updated + ' \u7b46\u5206\u985e slug');
    await prisma.$disconnect();
}

main();
