require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma/client.js');

const fallbackDatabaseUrl = 'postgresql://prisma:prisma@127.0.0.1:5432/prisma?schema=public';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? fallbackDatabaseUrl });

module.exports = {
  PrismaClient,
  createPrismaClient(options = {}) {
    return new PrismaClient({ adapter, ...options });
  },
};
