import { createPrismaClient } from './prisma-client.mjs';
const prisma = createPrismaClient();
async function main() {
    try {
        const settings = await prisma.setting.findMany({ where: { category: 'company' } });
        console.log(JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();

