import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const uploadsRoot = process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public', 'uploads');
const knownExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.exe'];
const { Client } = pg;

function normalizeUploadsRelativePath(filepath) {
  const normalized = filepath.trim();

  if (normalized.startsWith('/api/uploads/')) {
    return normalized.slice('/api/uploads/'.length);
  }

  if (normalized.startsWith('/uploads/')) {
    return normalized.slice('/uploads/'.length);
  }

  const uploadsMarker = '/uploads/';
  const markerIndex = normalized.indexOf(uploadsMarker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + uploadsMarker.length);
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

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(`
    SELECT id, filename, filepath, entity_type AS "entityType", entity_id AS "entityId", doc_type AS "docType"
    FROM uploaded_files
    ORDER BY entity_type ASC NULLS LAST, doc_type ASC NULLS LAST, filename ASC
  `);
  const uploadedFiles = result.rows;

  const unsupportedPaths = [];
  const missingFiles = [];

  for (const file of uploadedFiles) {
    const relativePath = normalizeUploadsRelativePath(file.filepath);
    if (!relativePath) {
      unsupportedPaths.push(file);
      continue;
    }

    const absolutePath = path.join(uploadsRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      const alternate = findAlternateFile(absolutePath);
      missingFiles.push({
        ...file,
        relativePath,
        suggestion: alternate ? path.relative(uploadsRoot, alternate) : null,
      });
    }
  }

  const byEntityType = new Map();
  for (const file of uploadedFiles) {
    const key = file.entityType || 'none';
    byEntityType.set(key, (byEntityType.get(key) || 0) + 1);
  }

  console.log('Uploads integrity check');
  console.log('=======================');
  console.log(`Uploads root: ${uploadsRoot}`);
  console.log(`DB uploaded_files rows: ${uploadedFiles.length}`);
  console.log(`Unsupported DB paths: ${unsupportedPaths.length}`);
  console.log(`Missing files on disk: ${missingFiles.length}`);
  console.log('');
  console.log('Entity type distribution:');
  for (const [entityType, count] of [...byEntityType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${entityType}: ${count}`);
  }

  if (unsupportedPaths.length > 0) {
    console.log('');
    console.log('Unsupported filepath samples:');
    for (const file of unsupportedPaths.slice(0, 10)) {
      console.log(`- ${file.filepath} (${file.entityType || 'none'} / ${file.filename})`);
    }
  }

  if (missingFiles.length > 0) {
    console.log('');
    console.log('Missing file samples:');
    for (const file of missingFiles.slice(0, 25)) {
      const suggestion = file.suggestion ? ` -> alternate exists: ${file.suggestion}` : '';
      console.log(`- ${file.relativePath} (${file.entityType || 'none'} / ${file.filename})${suggestion}`);
    }
  }

  await client.end();

  if (unsupportedPaths.length > 0 || missingFiles.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
