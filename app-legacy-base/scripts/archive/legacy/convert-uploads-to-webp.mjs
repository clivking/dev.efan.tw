/**
 * One-time script: convert existing PNG/JPG product uploads to WebP
 * Run inside Docker: docker exec efan-app-dev node /app/scripts/convert-uploads-to-webp.mjs
 */
import sharp from 'sharp';
import { readFileSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Connect to DB using pg directly
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const { Client } = require('pg');
const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

const PRODUCTS_DIR = '/app/public/uploads/products';
const CONVERT_EXTS = ['.png', '.jpg', '.jpeg'];

// Find all PNG/JPG in products dir
let files = [];
try {
  const result = execSync(`find ${PRODUCTS_DIR} -type f`, { encoding: 'utf8' });
  files = result.trim().split('\n').filter(f => {
    const ext = path.extname(f).toLowerCase();
    return CONVERT_EXTS.includes(ext);
  });
} catch (e) {
  console.error('find failed:', e.message);
  process.exit(1);
}

console.log(`Found ${files.length} PNG/JPG product files to convert\n`);
let converted = 0, skipped = 0, errors = 0;

for (const srcPath of files) {
  const ext = path.extname(srcPath).toLowerCase();
  const basename = path.basename(srcPath, ext);
  const destPath = path.join(PRODUCTS_DIR, basename + '.webp');
  const relSrc = '/api/uploads/products/' + path.basename(srcPath);
  const relDest = '/api/uploads/products/' + basename + '.webp';

  try {
    // Convert to WebP
    await sharp(srcPath)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(destPath);

    // Update DB record
    const result = await client.query(
      `UPDATE uploaded_files
       SET filepath = $1, mimetype = 'image/webp', filename = $2
       WHERE filepath = $3`,
      [relDest, basename + '.webp', relSrc]
    );

    // Delete original
    unlinkSync(srcPath);

    const saved = Math.round((readFileSync(destPath).length) / 1024);
    converted++;
    console.log(`✓ ${path.basename(srcPath)} → ${basename}.webp (${saved}KB) [DB rows: ${result.rowCount}]`);
  } catch (e) {
    errors++;
    console.error(`✗ ${path.basename(srcPath)}: ${e.message}`);
  }
}

await client.end();
console.log(`\n✅ Done: ${converted} converted, ${skipped} skipped, ${errors} errors`);
