import bcryptjs from 'bcryptjs';
import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function main() {
    const username = 'cliv';
    const password = '0982';
    const passwordHash = await bcryptjs.hash(password, 12);

    await prisma.user.upsert({
        where: { username },
        update: { passwordHash, isActive: true, role: 'admin' },
        create: {
            username,
            passwordHash,
            name: 'Cliv Account',
            role: 'admin',
            isActive: true,
        },
    });

    console.log('已將 cliv 帳號密碼重設為 0982');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });