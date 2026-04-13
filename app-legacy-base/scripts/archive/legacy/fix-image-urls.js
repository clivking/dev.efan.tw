// Fix old /uploads/ URLs to /api/uploads/ in database
const { createPrismaClient } = require('./prisma-client.cjs');
const prisma = createPrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { imageUrl: { startsWith: '/uploads/' } },
    });
    console.log('Products with old image URL: ' + products.length);
    for (const product of products) {
        const newUrl = product.imageUrl.replace('/uploads/', '/api/uploads/');
        await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: newUrl },
        });
        console.log('  Fixed: ' + product.name + ' -> ' + newUrl);
    }

    const files = await prisma.uploadedFile.findMany({
        where: { filepath: { startsWith: '/uploads/' } },
    });
    console.log('\nUploadedFile records with old path: ' + files.length);
    for (const file of files) {
        const newPath = file.filepath.replace('/uploads/', '/api/uploads/');
        await prisma.uploadedFile.update({
            where: { id: file.id },
            data: { filepath: newPath },
        });
        console.log('  Fixed: ' + file.filename + ' -> ' + newPath);
    }

    const settings = await prisma.setting.findMany({
        where: { value: { startsWith: '/uploads/' } },
    });
    console.log('\nSettings with old path: ' + settings.length);
    for (const setting of settings) {
        const newValue = setting.value.replace('/uploads/', '/api/uploads/');
        await prisma.setting.update({
            where: { id: setting.id },
            data: { value: newValue },
        });
        console.log('  Fixed: ' + setting.key + ' -> ' + newValue);
    }

    console.log('\nDone!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
