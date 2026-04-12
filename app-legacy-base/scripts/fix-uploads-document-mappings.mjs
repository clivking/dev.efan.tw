import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const uploadsRoot = process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public', 'uploads');
const { Client } = pg;
const shouldApply = process.argv.includes('--apply');

function splitUploadsPath(filepath) {
  const normalized = filepath.trim();

  if (normalized.startsWith('/api/uploads/')) {
    return { prefix: '/api/uploads/', relativePath: normalized.slice('/api/uploads/'.length) };
  }

  if (normalized.startsWith('/uploads/')) {
    return { prefix: '/uploads/', relativePath: normalized.slice('/uploads/'.length) };
  }

  return null;
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(uploadsRoot, relativePath));
}

function buildCandidate(row) {
  const split = splitUploadsPath(row.filepath);
  if (!split) return null;

  const decodedRelativePath = decodeURIComponent(split.relativePath);
  if (decodedRelativePath !== split.relativePath && fileExists(decodedRelativePath)) {
    return {
      reason: 'decoded-path-exists',
      newFilepath: `${split.prefix}${decodedRelativePath}`,
      newFilename: path.basename(decodedRelativePath),
    };
  }

  const soyalManual = row.filename.match(/^(SOYAL_.+)_說明書\.pdf$/);
  if (soyalManual) {
    const dmFilename = `${soyalManual[1]}_DM.pdf`;
    const dmRelativePath = path.posix.join(path.posix.dirname(split.relativePath), dmFilename);
    if (fileExists(dmRelativePath)) {
      return {
        reason: 'soyal-manual-to-dm',
        newFilepath: `${split.prefix}${dmRelativePath}`,
        newFilename: dmFilename,
      };
    }
  }

  return null;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(`
    SELECT id, filepath, filename, mimetype, entity_type AS "entityType"
    FROM uploaded_files
    WHERE position('%' in filepath) > 0 OR filename LIKE 'SOYAL_%說明書.pdf'
    ORDER BY filepath
  `);

  const candidates = [];
  for (const row of result.rows) {
    const candidate = buildCandidate(row);
    if (candidate && candidate.newFilepath !== row.filepath) {
      candidates.push({
        id: row.id,
        entityType: row.entityType || 'none',
        oldFilepath: row.filepath,
        newFilepath: candidate.newFilepath,
        oldFilename: row.filename,
        newFilename: candidate.newFilename,
        reason: candidate.reason,
      });
    }
  }

  const byReason = new Map();
  for (const item of candidates) {
    byReason.set(item.reason, (byReason.get(item.reason) || 0) + 1);
  }

  console.log('Uploads document/path mapping repair');
  console.log('===================================');
  console.log(`Candidates found: ${candidates.length}`);
  console.log(`Mode: ${shouldApply ? 'apply' : 'dry-run'}`);

  if (candidates.length) {
    console.log('');
    console.log('Candidates by reason:');
    for (const [reason, count] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`- ${reason}: ${count}`);
    }

    console.log('');
    console.log('Sample changes:');
    for (const item of candidates.slice(0, 25)) {
      console.log(`- [${item.reason}] ${item.oldFilepath} -> ${item.newFilepath}`);
    }
  }

  if (shouldApply && candidates.length) {
    await client.query('BEGIN');
    try {
      for (const item of candidates) {
        await client.query(
          'UPDATE uploaded_files SET filepath = $2, filename = $3 WHERE id = $1',
          [item.id, item.newFilepath, item.newFilename]
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
