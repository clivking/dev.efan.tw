import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();

async function check() {
  const customers = await prisma.customer.count();
  const companies = await prisma.companyName.count();
  const contacts = await prisma.contact.count();
  const locations = await prisma.location.count();
  const quotes = await prisma.quote.count();

  console.log('--- Database counts ---');
  console.log(`Customers: ${customers}`);
  console.log(`Company names: ${companies}`);
  console.log(`Contacts: ${contacts}`);
  console.log(`Locations: ${locations}`);
  console.log(`Quotes: ${quotes}`);

  if (customers === 0 && companies === 0 && contacts === 0 && locations === 0 && quotes === 0) {
    console.log('Database appears empty.');
  } else {
    console.log('Database contains seeded or working data.');
  }
}

check()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
