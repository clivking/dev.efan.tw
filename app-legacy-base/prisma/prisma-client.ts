import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const fallbackDatabaseUrl = 'postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? fallbackDatabaseUrl });

export { PrismaClient };
export function createPrismaClient(options: ConstructorParameters<typeof PrismaClient>[0] = {}) {
  return new PrismaClient({ adapter, ...options });
}

