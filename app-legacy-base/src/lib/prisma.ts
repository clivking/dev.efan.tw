import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma-v7/client';

const fallbackDatabaseUrl = 'postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? fallbackDatabaseUrl });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
