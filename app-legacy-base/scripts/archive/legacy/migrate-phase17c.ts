/**
 * Migration scripts for PHASE 17C
 *
 * Run with: npx tsx scripts/migrate-phase17c.ts
 *
 * 1. Migrate imageUrl to uploaded_files (product_website entityType)
 * 2. Convert websiteDescription plain text into HTML paragraphs
 */

import { randomUUID } from 'crypto';
import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();

async function migrateImageUrls() {
    console.log('
=== 1. Migrating imageUrl to uploaded_files ===');

    const products = await prisma.product.findMany({
        where: {
            imageUrl: { not: null },
            isDeleted: false,
        },
        select: {
            id: true,
            name: true,
            imageUrl: true,
        },
    });

    console.log(
        'Found ' + products.length + ' products with legacy imageUrl values'
    );

    let migrated = 0;
    let skipped = 0;

    for (const product of products) {
        if (!product.imageUrl?.trim()) {
            skipped++;
            continue;
        }

        const existing = await prisma.uploadedFile.findFirst({
            where: {
                entityType: 'product_website',
                entityId: product.id,
            },
        });

        if (existing) {
            console.log('  SKIP [' + product.name + '] already has website images');
            skipped++;
            continue;
        }

        const urlParts = product.imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1] || 'migrated-image.jpg';
        const mimetype = filename.endsWith('.png')
            ? 'image/png'
            : filename.endsWith('.webp')
                ? 'image/webp'
                : 'image/jpeg';

        await prisma.uploadedFile.create({
            data: {
                id: randomUUID(),
                entityType: 'product_website',
                entityId: product.id,
                filename,
                filepath: product.imageUrl,
                mimetype,
                size: 0,
                sortOrder: 0,
            },
        });

        console.log('  Migrated [' + product.name + '] -> ' + filename);
        migrated++;
    }

    console.log('
Image migration done: ' + migrated + ' migrated, ' + skipped + ' skipped');
}

async function migrateWebsiteDescription() {
    console.log('
=== 2. Converting websiteDescription plain text to HTML ===');

    const products = await prisma.product.findMany({
        where: {
            websiteDescription: { not: null },
            isDeleted: false,
        },
        select: {
            id: true,
            name: true,
            websiteDescription: true,
        },
    });

    console.log(
        'Found ' + products.length + ' products with websiteDescription content'
    );

    let migrated = 0;
    let skipped = 0;

    for (const product of products) {
        const desc = product.websiteDescription;
        if (!desc?.trim()) {
            skipped++;
            continue;
        }

        if (desc.trim().startsWith('<')) {
            console.log('  SKIP [' + product.name + '] already uses HTML');
            skipped++;
            continue;
        }

        const normalized = desc.replace(/
/g, '
').replace(//g, '
');
        const paragraphs = normalized.split(/
{2,}/);

        const html = paragraphs
            .map((paragraph) => {
                const lines = paragraph
                    .trim()
                    .split('
')
                    .map((line) => line.trim())
                    .filter(Boolean);

                return '<p>' + lines.join('<br>') + '</p>';
            })
            .filter((paragraph) => paragraph !== '<p></p>')
            .join('');

        if (html === desc) {
            skipped++;
            continue;
        }

        await prisma.product.update({
            where: { id: product.id },
            data: { websiteDescription: html },
        });

        console.log('  Converted [' + product.name + ']');
        migrated++;
    }

    console.log('
Description migration done: ' + migrated + ' migrated, ' + skipped + ' skipped');
}

async function main() {
    console.log('Starting PHASE 17C migrations...');
    console.log(
        'Database: ' +
        (process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown')
    );

    try {
        await migrateImageUrls();
        await migrateWebsiteDescription();

        console.log('
All migrations complete!');
        console.log('
Next steps:');
        console.log('  1. Verify migrated data in the admin UI');
        console.log('  2. After confirming, remove the legacy imageUrl column');
        console.log('  3. Run: npx prisma migrate dev --name remove-image-url');
    } catch (error) {
        console.error('
Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
