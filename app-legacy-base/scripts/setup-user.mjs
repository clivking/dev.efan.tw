import { createPrismaClient } from './prisma-client.mjs';
import bcrypt from 'bcryptjs';

const prisma = createPrismaClient();

async function checkAndCreate() {
    const username = 'cliv';
    const password = '0982';

    const existing = await prisma.user.findUnique({
        where: { username }
    });

    if (existing) {
        console.log(`User ${username} already exists.`);
        // Note: We don't update password here to avoid accidental overrides
    } else {
        console.log(`Creating user ${username}...`);
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                username,
                passwordHash,
                name: 'Cliv Account',
                role: 'admin'
            }
        });
        console.log('User created successfully.');
    }
    await prisma.$disconnect();
}

checkAndCreate().catch(console.error);

