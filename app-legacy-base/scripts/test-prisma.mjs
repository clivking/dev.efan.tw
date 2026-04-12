import { createPrismaClient } from './prisma-client.mjs';

console.log('Successfully imported Prisma script helper');

const prisma = createPrismaClient();

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log('Successfully connected with Prisma 7 adapter');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
