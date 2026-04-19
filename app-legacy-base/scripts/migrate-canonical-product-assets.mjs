import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const { Client } = pg;

const uploadsRoot = process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public', 'uploads');
const reportPath = process.argv.find((arg) => arg.startsWith('--report='))?.slice('--report='.length);
const shouldApply = process.argv.includes('--apply');

function usage() {
  console.error('Usage: node scripts/migrate-canonical-product-assets.mjs --report=/tmp/canonical-uploads-audit.json [--apply]');
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeRelativePath(apiPath) {
  if (apiPath.startsWith('/api/uploads/')) return apiPath.slice('/api/uploads/'.length);
  if (apiPath.startsWith('/uploads/')) return apiPath.slice('/uploads/'.length);
  return apiPath;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function assertInsideUploads(relativePath) {
  const absolutePath = path.resolve(uploadsRoot, relativePath);
  const root = path.resolve(uploadsRoot);
  if (!absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing path outside uploads root: ${relativePath}`);
  }
  return absolutePath;
}

function resolveExistingUploadPath(relativePath) {
  const rawAbsolutePath = assertInsideUploads(relativePath);
  if (fs.existsSync(rawAbsolutePath)) return rawAbsolutePath;

  const decodedRelativePath = safeDecode(relativePath);
  const decodedAbsolutePath = assertInsideUploads(decodedRelativePath);
  if (fs.existsSync(decodedAbsolutePath)) return decodedAbsolutePath;

  return rawAbsolutePath;
}

if (!reportPath) {
  usage();
  process.exit(2);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const missingIds = new Set((report.missingUploadedFileRows || []).map((row) => row.id));
const targetCounts = new Map();

for (const row of report.canonicalViolations || []) {
  if (!row.expectedRelativePath) continue;
  targetCounts.set(row.expectedRelativePath, (targetCounts.get(row.expectedRelativePath) || 0) + 1);
}

const candidates = [];
const skipped = [];

for (const row of report.canonicalViolations || []) {
  if (!row.id || !row.filepath || !row.expectedRelativePath) {
    skipped.push({ reason: 'incomplete-report-row', row });
    continue;
  }

  if (missingIds.has(row.id)) {
    skipped.push({ reason: 'source-missing', row });
    continue;
  }

  if ((targetCounts.get(row.expectedRelativePath) || 0) > 1) {
    skipped.push({ reason: 'duplicate-target', row });
    continue;
  }

  const oldRelativePath = normalizeRelativePath(row.filepath);
  const newRelativePath = row.expectedRelativePath;
  const oldAbsolutePath = resolveExistingUploadPath(oldRelativePath);
  const newAbsolutePath = assertInsideUploads(newRelativePath);

  if (!fs.existsSync(oldAbsolutePath)) {
    skipped.push({ reason: 'source-missing-on-disk', row });
    continue;
  }

  if (fs.existsSync(newAbsolutePath)) {
    const oldHash = sha256File(oldAbsolutePath);
    const newHash = sha256File(newAbsolutePath);
    if (oldHash !== newHash) {
      skipped.push({ reason: 'target-exists-with-different-content', row });
      continue;
    }
  }

  candidates.push({
    id: row.id,
    oldRelativePath,
    newRelativePath,
    oldApiPath: row.filepath,
    newApiPath: `/api/uploads/${newRelativePath}`,
    newFilename: path.posix.basename(newRelativePath),
    oldAbsolutePath,
    newAbsolutePath,
  });
}

console.log('Canonical product asset migration');
console.log('=================================');
console.log(`Uploads root: ${uploadsRoot}`);
console.log(`Mode: ${shouldApply ? 'apply' : 'dry-run'}`);
console.log(`Candidates: ${candidates.length}`);
console.log(`Skipped: ${skipped.length}`);

if (skipped.length) {
  const byReason = skipped.reduce((map, item) => {
    map.set(item.reason, (map.get(item.reason) || 0) + 1);
    return map;
  }, new Map());

  console.log('');
  console.log('Skipped by reason:');
  for (const [reason, count] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${reason}: ${count}`);
  }
}

if (candidates.length) {
  console.log('');
  console.log('Sample migrations:');
  for (const item of candidates.slice(0, 25)) {
    console.log(`- ${item.oldApiPath} -> ${item.newApiPath}`);
  }
}

if (shouldApply && candidates.length) {
  for (const item of candidates) {
    fs.mkdirSync(path.dirname(item.newAbsolutePath), { recursive: true });
    if (!fs.existsSync(item.newAbsolutePath)) {
      fs.copyFileSync(item.oldAbsolutePath, item.newAbsolutePath);
    }

    const oldHash = sha256File(item.oldAbsolutePath);
    const newHash = sha256File(item.newAbsolutePath);
    if (oldHash !== newHash) {
      throw new Error(`Checksum mismatch after copy: ${item.oldApiPath} -> ${item.newApiPath}`);
    }
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('BEGIN');
  try {
    for (const item of candidates) {
      await client.query(
        'UPDATE uploaded_files SET filepath = $2, filename = $3 WHERE id = $1',
        [item.id, item.newApiPath, item.newFilename],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  console.log('');
  console.log(`Applied migrations: ${candidates.length}`);
}
