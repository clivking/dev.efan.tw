import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const uploadsRoot = process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public', 'uploads');
const knownExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.exe'];
const extensionMimeMap = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.pdf', 'application/pdf'],
  ['.exe', 'application/octet-stream'],
]);
const { Client } = pg;
const shouldApply = process.argv.includes('--apply');

function normalizeUploadsRelativePath(filepath) {
  const normalized = filepath.trim();

  if (normalized.startsWith('/api/uploads/')) {
    return { prefix: '/api/uploads/', relativePath: normalized.slice('/api/uploads/'.length) };
  }

  if (normalized.startsWith('/uploads/')) {
    return { prefix: '/uploads/', relativePath: normalized.slice('/uploads/'.length) };
  }

  const uploadsMarker = '/uploads/';
  const markerIndex = normalized.indexOf(uploadsMarker);
  if (markerIndex >= 0) {
    return { prefix: normalized.slice(0, markerIndex + uploadsMarker.length), relativePath: normalized.slice(markerIndex + uploadsMarker.length) };
  }

  return null;
}

function findAlternateFile(absolutePath) {
  const dir = path.dirname(absolutePath);
  const ext = path.extname(absolutePath);
  const base = path.basename(absolutePath, ext);

  for (const candidateExt of knownExtensions) {
    if (candidateExt === ext) continue;
    const candidate = path.join(dir, `${base}${candidateExt}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function toPosixRelative(filePath) {
  return filePath.split(path.sep).join('/');
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(`
    SELECT id, filename, filepath, mimetype, entity_type AS "entityType"
    FROM uploaded_files
    ORDER BY entity_type ASC NULLS LAST, filename ASC
  `);

  const candidates = [];

  for (const row of result.rows) {
    const normalized = normalizeUploadsRelativePath(row.filepath);
    if (!normalized) continue;

    const absolutePath = path.join(uploadsRoot, normalized.relativePath);
    if (fs.existsSync(absolutePath)) continue;

    const alternate = findAlternateFile(absolutePath);
    if (!alternate) continue;

    const relativeAlternate = toPosixRelative(path.relative(uploadsRoot, alternate));
    const newFilepath = `${normalized.prefix}${relativeAlternate}`;
    const newFilename = path.basename(alternate);
    const newMimetype = extensionMimeMap.get(path.extname(alternate).toLowerCase()) || row.mimetype;

    candidates.push({
      id: row.id,
      entityType: row.entityType || 'none',
      oldFilepath: row.filepath,
      newFilepath,
      oldFilename: row.filename,
      newFilename,
      oldMimetype: row.mimetype,
      newMimetype,
    });
  }

  const byEntityType = new Map();
  for (const candidate of candidates) {
    byEntityType.set(candidate.entityType, (byEntityType.get(candidate.entityType) || 0) + 1);
  }

  console.log('Uploads extension drift repair');
  console.log('==============================');
  console.log(`Uploads root: ${uploadsRoot}`);
  console.log(`Candidates found: ${candidates.length}`);
  console.log(`Mode: ${shouldApply ? 'apply' : 'dry-run'}`);

  if (candidates.length > 0) {
    console.log('');
    console.log('Candidates by entity type:');
    for (const [entityType, count] of [...byEntityType.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`- ${entityType}: ${count}`);
    }

    console.log('');
    console.log('Sample changes:');
    for (const candidate of candidates.slice(0, 25)) {
      console.log(`- ${candidate.oldFilepath} -> ${candidate.newFilepath}`);
    }
  }

  if (shouldApply && candidates.length > 0) {
    await client.query('BEGIN');
    try {
      for (const candidate of candidates) {
        await client.query(
          `UPDATE uploaded_files
           SET filepath = $2, filename = $3, mimetype = $4
           WHERE id = $1`,
          [candidate.id, candidate.newFilepath, candidate.newFilename, candidate.newMimetype]
        );
      }
      await client.query('COMMIT');
      console.log('');
      console.log(`Applied updates: ${candidates.length}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
