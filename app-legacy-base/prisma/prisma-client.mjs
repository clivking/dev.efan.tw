import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import clientPkg from '../src/generated/prisma/client.js';

const { PrismaClient } = clientPkg;
const fallbackDatabaseUrl = 'postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? fallbackDatabaseUrl });

export { PrismaClient };
export function createPrismaClient(options = {}) {
  return new PrismaClient({ adapter, ...options });
}

