import { createPrismaClient } from './prisma-client';
const prisma = createPrismaClient();
async function main() {
    const s = await prisma.setting.findMany({ where: { key: { in: ['company_email', 'company_stamp_url', 'company_address'] } } });
    console.log(JSON.stringify(s, null, 2));
}
main();

