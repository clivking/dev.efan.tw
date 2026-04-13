const { createPrismaClient } = require('./prisma-client.cjs');
const prisma = createPrismaClient();

async function main() {
  const key = 'exclude_view_tracking_ips';
  const value = '2001:b011:1001:d2b1:7c1a:efae:fa56:259d,2001:b011:1001:d2b1:3843:30a6:e9:4bb1';

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
      type: 'string',
      category: 'quote',
      description: '\u6392\u9664\u8ffd\u8e64\u7528 IP \u6e05\u55ae\uff08\u9017\u865f\u5206\u9694\uff09',
    },
  });

  console.log('Updated exclude_view_tracking_ips');
}

main()
  .catch((error) => console.error(error))
  .finally(() => prisma.$disconnect());
