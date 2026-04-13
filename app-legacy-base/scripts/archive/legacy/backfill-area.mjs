import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

function extractArea(address) {
  if (!address) return '';
  const match = address.match(/(?:市|縣)([^市縣]+?(?:區|鄉|鎮|市))/);
  if (match && match[1]) {
    return match[1];
  }
  return '';
}

async function main() {
  console.log('Starting area backfill...');

  const quotes = await prisma.quote.findMany({
    where: {
      area: null,
      locationId: { not: null },
    },
    include: {
      location: true,
    },
  });

  console.log(`Found ${quotes.length} quotes to update.`);

  for (const quote of quotes) {
    if (quote.location?.address) {
      const area = extractArea(quote.location.address);
      if (area) {
        await prisma.quote.update({
          where: { id: quote.id },
          data: { area },
        });
        console.log(`Updated Quote ${quote.quoteNumber}: ${area}`);
      }
    }
  }

  console.log('Backfill completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
