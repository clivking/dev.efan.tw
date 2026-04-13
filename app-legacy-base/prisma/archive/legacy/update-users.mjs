import bcryptjs from 'bcryptjs';
import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function upsertAdmin(username, password, name) {
    const passwordHash = await bcryptjs.hash(password, 12);
    const existing = await prisma.user.findUnique({ where: { username } });

    if (!existing) {
        await prisma.user.create({
            data: {
                username,
                passwordHash,
                name,
                role: 'admin',
                isActive: true,
            },
        });
        console.log('已建立管理員帳號 ' + username);
        return;
    }

    await prisma.user.update({
        where: { username },
        data: { passwordHash, name, role: 'admin', isActive: true },
    });
    console.log('已更新管理員帳號 ' + username);
}

async function main() {
    console.log('開始更新使用者帳號...');

    await prisma.user.deleteMany({
        where: { username: { in: ['boss', 'wife'] } },
    });

    await upsertAdmin('cliv', '0982', '黃禾霆');
    await upsertAdmin('yuny', '0980', 'Yuny');

    console.log('使用者帳號更新完成');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });