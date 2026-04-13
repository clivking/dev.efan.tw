const { createPrismaClient } = require('./prisma-client.cjs');
const bcrypt = require('bcryptjs');

const prisma = createPrismaClient();

async function reset() {
    const username = 'cliv';
    const password = '0982';

    console.log(`Resetting user ${username} to 0982...`);
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { username },
        update: {
            passwordHash,
            isActive: true,
            role: 'admin'
        },
        create: {
            username,
            passwordHash,
            name: 'Cliv Account',
            role: 'admin',
            isActive: true
        }
    });

    console.log('User reset successfully.');
    await prisma.$disconnect();
}

reset().catch(console.error);

