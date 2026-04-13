const { createPrismaClient } = require('./prisma-client.cjs');
const bcrypt = require('bcryptjs');

async function main() {
    const prisma = createPrismaClient();

    // 1. User
    const hash = await bcrypt.hash('0982', 12);
    const user = await prisma.user.upsert({
        where: { username: 'cliv' },
        update: { passwordHash: hash, isActive: true, role: 'admin' },
        create: {
            username: 'cliv',
            passwordHash: hash,
            name: 'Cliv Account',
            role: 'admin',
            isActive: true,
        },
    });
    console.log('USER_ID:', user.id);

    // 2. Category
    const category = await prisma.productCategory.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Test Category',
        },
    });

    // 3. Product
    const product = await prisma.product.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: { isDeleted: false },
        create: {
            id: '00000000-0000-0000-0000-000000000002',
            name: 'Test Product',
            quoteName: 'Quote Test Product',
            sellingPrice: 1000,
            costPrice: 500,
            unit: 'PC',
            categoryId: category.id,
        },
    });
    console.log('PRODUCT_ID:', product.id);

    // 4. Customer
    const customer = await prisma.customer.upsert({
        where: { customerNumber: '20260304-C01' },
        update: { isDeleted: false },
        create: {
            customerNumber: '20260304-C01',
            companyNames: {
                create: {
                    companyName: 'Test Company',
                    isPrimary: true,
                    taxId: '12345678'
                }
            },
            contacts: {
                create: {
                    name: 'Test Contact',
                    isPrimary: true,
                    mobile: '0912345678'
                }
            }
        },
        include: { companyNames: true, contacts: true }
    });
    console.log('CUSTOMER_ID:', customer.id);
    console.log('CONTACT_ID:', customer.contacts[0].id);
    console.log('COMPANY_NAME_ID:', customer.companyNames[0].id);

    await prisma.$disconnect();
}
main();

