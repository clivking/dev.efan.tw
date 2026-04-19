import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const { Client } = pg;

const uploadsRoot = process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public', 'uploads');
const sourceRoot = process.cwd();
const reportLimit = Number(process.env.UPLOADS_AUDIT_LIMIT || 25);
const jsonOutArg = process.argv.find((arg) => arg.startsWith('--json-out='));
const jsonOutPath = jsonOutArg ? jsonOutArg.slice('--json-out='.length) : null;

const productImageEntityTypes = new Set(['product_website', 'product_content_image']);
const productDocumentEntityTypes = new Set(['product_document']);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const documentExtensions = new Set(['.pdf']);
const ignoredSourceDirs = new Set([
  '.git',
  '.next',
  '.next.root-owned-backup-20260414-185025',
  'docs',
  'node_modules',
  'src/generated',
]);
const sourceExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.prisma',
  '.css',
  '.html',
]);

const uploadReferencePattern = /(?:https?:\/\/[^"'\s)]+)?(?:\/api\/uploads\/|\/uploads\/)[^"'\s),<>{}\]]+/g;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function stripTrailingPunctuation(value) {
  return value.replace(/[.;:!?]+$/g, '');
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeReference(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = stripTrailingPunctuation(value.trim());
  if (trimmed.includes('${') || trimmed.includes('$')) return null;

  let pathname = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  const apiPrefix = '/api/uploads/';
  const publicPrefix = '/uploads/';

  let relativePath = null;

  if (pathname.startsWith(apiPrefix)) {
    relativePath = pathname.slice(apiPrefix.length);
  } else if (pathname.startsWith(publicPrefix)) {
    relativePath = pathname.slice(publicPrefix.length);
  } else {
    const marker = '/uploads/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex >= 0) {
      relativePath = pathname.slice(markerIndex + marker.length);
    }
  }

  if (!relativePath) return null;

  const decoded = safeDecode(relativePath);
  if (!path.posix.extname(decoded)) return null;
  return decoded;
}

function publicApiPath(relativePath) {
  return `/api/uploads/${toPosix(relativePath)}`;
}

function normalizeModel(value) {
  if (!value) return null;

  const normalized = value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');

  return normalized || null;
}

function normalizeDocType(value, filename) {
  const source = `${value || ''} ${filename || ''}`.toLowerCase();

  if (source.includes('manual') || source.includes('說明') || source.includes('user-guide')) return 'Manual';
  if (source.includes('spec') || source.includes('datasheet') || source.includes('規格')) return 'Spec';
  if (source.includes('wiring') || source.includes('接線')) return 'Wiring';
  if (source.includes('install') || source.includes('安裝')) return 'Installation';
  if (source.includes('cert')) return 'Certificate';
  if (source.includes('firmware')) return 'Firmware';
  if (source.includes('software')) return 'Software';
  if (source.includes('dm')) return 'DM';

  return value ? normalizeModel(value) : 'Document';
}

function inferImageRole(filename, index) {
  const lower = filename.toLowerCase();
  const orderedDefaults = ['front', 'angle', 'dimensions', 'wiring', 'installation'];

  if (lower.includes('front') || lower.includes('main')) return 'front';
  if (lower.includes('angle') || lower.includes('side')) return 'angle';
  if (lower.includes('dimension') || lower.includes('size')) return 'dimensions';
  if (lower.includes('wiring') || lower.includes('wire')) return 'wiring';
  if (lower.includes('install')) return 'installation';
  if (lower.includes('detail')) return 'detail';
  if (lower.includes('accessor')) return 'accessory';
  if (lower.includes('package')) return 'package';
  if (lower.includes('comparison')) return 'comparison';

  return orderedDefaults[index - 1] || 'detail';
}

function expectedProductAsset(row, siblingIndex) {
  const model = normalizeModel(row.productModel || row.productName);
  if (!model) return null;

  const ext = path.extname(row.filename || row.filepath).toLowerCase();
  if (productImageEntityTypes.has(row.entityType)) {
    const index = String(siblingIndex).padStart(2, '0');
    const role = inferImageRole(row.filename || path.basename(row.filepath), siblingIndex);
    return `products/${model}/images/${model}_${index}_${role}${ext || '.png'}`;
  }

  if (productDocumentEntityTypes.has(row.entityType)) {
    const docType = normalizeDocType(row.docType, row.filename);
    return `products/${model}/documents/${model}_${docType}${ext || '.pdf'}`;
  }

  return null;
}

function isCanonicalProductAsset(row, relativePath) {
  const model = normalizeModel(row.productModel || row.productName);
  if (!model) return false;

  if (productImageEntityTypes.has(row.entityType)) {
    const escapedModel = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^products/${escapedModel}/images/${escapedModel}_\\d{2}_[A-Za-z0-9-]+\\.(png|jpg|jpeg|webp|gif)$`).test(relativePath);
  }

  if (productDocumentEntityTypes.has(row.entityType)) {
    const escapedModel = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^products/${escapedModel}/documents/${escapedModel}_[A-Za-z0-9_-]+\\.pdf$`).test(relativePath);
  }

  return true;
}

function walkFiles(root, options = {}) {
  const files = [];
  const stack = [''];

  while (stack.length) {
    const relativeDir = stack.pop();
    const absoluteDir = path.join(root, relativeDir);
    if (!fs.existsSync(absoluteDir)) continue;

    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const relativePath = path.join(relativeDir, entry.name);
      const posixPath = toPosix(relativePath);

      if (entry.isDirectory()) {
        if (options.ignoreDir?.(posixPath, entry.name)) continue;
        stack.push(relativePath);
        continue;
      }

      if (entry.isFile()) {
        if (options.includeFile && !options.includeFile(posixPath, entry.name)) continue;
        files.push(posixPath);
      }
    }
  }

  return files.sort();
}

function extractReferencesFromText(value) {
  if (!value || typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!/[\r\n]/.test(trimmed) && (/^(https?:\/\/|\/api\/uploads\/|\/uploads\/)/i.test(trimmed))) {
    const exactReference = normalizeReference(trimmed);
    if (exactReference) return [exactReference];
  }

  const matches = value.match(uploadReferencePattern) || [];
  return matches.map(normalizeReference).filter(Boolean);
}

async function loadUploadedFiles(client) {
  const result = await client.query(`
    SELECT
      uf.id,
      uf.filename,
      uf.filepath,
      uf.mimetype,
      uf.entity_type AS "entityType",
      uf.entity_id AS "entityId",
      uf.doc_type AS "docType",
      uf.sort_order AS "sortOrder",
      p.model AS "productModel",
      p.name AS "productName",
      p.seo_slug AS "productSlug"
    FROM uploaded_files uf
    LEFT JOIN products p ON p.id = uf.entity_id
    ORDER BY uf.entity_type ASC NULLS LAST, p.model ASC NULLS LAST, uf.sort_order ASC, uf.created_at ASC
  `);

  return result.rows;
}

async function loadDatabaseReferences(client) {
  const columnResult = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name <> 'audit_logs'
      AND (
        data_type IN ('text', 'json', 'jsonb')
        OR data_type LIKE 'character varying%'
      )
    ORDER BY table_name, ordinal_position
  `);

  const references = [];

  for (const column of columnResult.rows) {
    const table = column.table_name;
    const field = column.column_name;
    const result = await client.query(
      `SELECT id::text AS id, ${quoteIdent(field)}::text AS value FROM ${quoteIdent(table)} WHERE ${quoteIdent(field)}::text LIKE '%/uploads/%'`
    );

    for (const row of result.rows) {
      for (const relativePath of extractReferencesFromText(row.value)) {
        references.push({
          sourceType: 'db',
          source: `${table}.${field}:${row.id}`,
          relativePath,
        });
      }
    }
  }

  return references;
}

function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

function loadSourceReferences() {
  const files = walkFiles(sourceRoot, {
    ignoreDir: (relativePath, name) => {
      if (ignoredSourceDirs.has(relativePath) || ignoredSourceDirs.has(name)) return true;
      if (relativePath.startsWith('public/uploads')) return true;
      return false;
    },
    includeFile: (relativePath) => sourceExtensions.has(path.extname(relativePath).toLowerCase()),
  });

  const references = [];

  for (const file of files) {
    const absolutePath = path.join(sourceRoot, file);
    const content = fs.readFileSync(absolutePath, 'utf8');
    for (const relativePath of extractReferencesFromText(content)) {
      references.push({
        sourceType: 'source',
        source: file,
        relativePath,
      });
    }
  }

  return references;
}

function classifyUploadedFiles(uploadedFiles, existingFileKeySet) {
  const productSiblings = new Map();
  const rowsWithRelativePath = uploadedFiles.map((row) => ({
    ...row,
    relativePath: normalizeReference(row.filepath),
  }));

  for (const row of rowsWithRelativePath) {
    if (!row.relativePath) continue;
    if (!productImageEntityTypes.has(row.entityType) && !productDocumentEntityTypes.has(row.entityType)) continue;
    const key = productImageEntityTypes.has(row.entityType)
      ? `product_images:${row.entityId || 'none'}`
      : `${row.entityType}:${row.entityId || 'none'}`;
    if (!productSiblings.has(key)) productSiblings.set(key, []);
    productSiblings.get(key).push(row);
  }

  for (const siblings of productSiblings.values()) {
    siblings.sort((a, b) => {
      const entityPriority = (entityType) => (entityType === 'product_website' ? 0 : 1);
      const priorityDiff = entityPriority(a.entityType) - entityPriority(b.entityType);
      if (priorityDiff !== 0) return priorityDiff;
      const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0;
      const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.filename).localeCompare(String(b.filename));
    });
  }

  const missing = [];
  const unsupported = [];
  const canonicalViolations = [];

  for (const row of rowsWithRelativePath) {
    if (!row.relativePath) {
      unsupported.push(row);
      continue;
    }

    if (!existingFileKeySet.has(row.relativePath)) {
      missing.push(row);
    }

    if (productImageEntityTypes.has(row.entityType) || productDocumentEntityTypes.has(row.entityType)) {
      const key = productImageEntityTypes.has(row.entityType)
        ? `product_images:${row.entityId || 'none'}`
        : `${row.entityType}:${row.entityId || 'none'}`;
      const siblings = productSiblings.get(key) || [row];
      const siblingIndex = Math.max(1, siblings.findIndex((item) => item.id === row.id) + 1);
      const expectedRelativePath = expectedProductAsset(row, siblingIndex);

      if (expectedRelativePath && !isCanonicalProductAsset(row, row.relativePath)) {
        canonicalViolations.push({
          ...row,
          expectedRelativePath,
          expectedApiPath: publicApiPath(expectedRelativePath),
        });
      }
    }
  }

  return { missing, unsupported, canonicalViolations };
}

function buildInventory({ uploadFiles, allReferences }) {
  const referenceMap = new Map();
  const existingFileKeySet = new Set(uploadFiles.map((relativePath) => safeDecode(relativePath)));

  for (const ref of allReferences) {
    if (!referenceMap.has(ref.relativePath)) referenceMap.set(ref.relativePath, []);
    referenceMap.get(ref.relativePath).push(ref);
  }

  const unreferencedFiles = uploadFiles
    .filter((relativePath) => path.basename(relativePath) !== '.gitkeep')
    .filter((relativePath) => !referenceMap.has(safeDecode(relativePath)))
    .filter((relativePath) => !relativePath.startsWith('.quarantine/'));

  const allMissingReferencedPaths = [...referenceMap.keys()]
    .filter((relativePath) => !existingFileKeySet.has(relativePath))
    .map((relativePath) => ({
      relativePath,
      references: referenceMap.get(relativePath),
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const legacyMissingSignaturePaths = allMissingReferencedPaths.filter(isLegacyPublicSignatureReference);
  const missingReferencedPaths = allMissingReferencedPaths.filter((item) => !isLegacyPublicSignatureReference(item));

  return { referenceMap, unreferencedFiles, missingReferencedPaths, legacyMissingSignaturePaths };
}

function isLegacyPublicSignatureReference(item) {
  if (!item.relativePath.startsWith('signatures/')) return false;
  return item.references.every((reference) => {
    return reference.sourceType === 'db' && reference.source.startsWith('quote_signatures.signature_image:');
  });
}

function formatSample(items, formatter) {
  if (!items.length) return ['  none'];
  return items.slice(0, reportLimit).map(formatter);
}

function sha256File(absolutePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absolutePath));
  return hash.digest('hex');
}

async function main() {
  if (!fs.existsSync(uploadsRoot)) {
    throw new Error(`Uploads root does not exist: ${uploadsRoot}`);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const uploadedFiles = await loadUploadedFiles(client);
  const dbReferences = await loadDatabaseReferences(client);
  await client.end();

  const sourceReferences = loadSourceReferences();
  const uploadFiles = walkFiles(uploadsRoot, {
    ignoreDir: (relativePath) => relativePath.startsWith('.quarantine'),
  });
  const existingFileKeySet = new Set(uploadFiles.map((relativePath) => safeDecode(relativePath)));
  const allReferences = [...dbReferences, ...sourceReferences];
  const inventory = buildInventory({ uploadFiles, allReferences });
  const uploadedFileClassification = classifyUploadedFiles(uploadedFiles, existingFileKeySet);

  const flatProductFiles = uploadFiles.filter((relativePath) => {
    if (!relativePath.startsWith('products/')) return false;
    const rest = relativePath.slice('products/'.length);
    return !rest.includes('/');
  });

  const duplicateBasenames = [...uploadFiles.reduce((map, relativePath) => {
    const basename = path.basename(relativePath).toLowerCase();
    if (!map.has(basename)) map.set(basename, []);
    map.get(basename).push(relativePath);
    return map;
  }, new Map()).entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([basename, paths]) => ({ basename, paths }));

  const summary = {
    uploadsRoot,
    filesystemFiles: uploadFiles.length,
    dbUploadedFiles: uploadedFiles.length,
    dbReferences: dbReferences.length,
    sourceReferences: sourceReferences.length,
    missingUploadedFileRows: uploadedFileClassification.missing.length,
    unsupportedUploadedFileRows: uploadedFileClassification.unsupported.length,
    missingReferencedPaths: inventory.missingReferencedPaths.length,
    legacyMissingSignaturePaths: inventory.legacyMissingSignaturePaths.length,
    unreferencedFiles: inventory.unreferencedFiles.length,
    canonicalViolations: uploadedFileClassification.canonicalViolations.length,
    flatProductFiles: flatProductFiles.length,
    duplicateBasenames: duplicateBasenames.length,
  };

  console.log('Canonical uploads audit');
  console.log('=======================');
  console.log(`Uploads root: ${uploadsRoot}`);
  console.log(`Filesystem files: ${summary.filesystemFiles}`);
  console.log(`DB uploaded_files rows: ${summary.dbUploadedFiles}`);
  console.log(`DB upload references found: ${summary.dbReferences}`);
  console.log(`Source upload references found: ${summary.sourceReferences}`);
  console.log(`Missing uploaded_files rows: ${summary.missingUploadedFileRows}`);
  console.log(`Missing referenced paths: ${summary.missingReferencedPaths}`);
  console.log(`Legacy missing public signature paths: ${summary.legacyMissingSignaturePaths}`);
  console.log(`Unreferenced filesystem files: ${summary.unreferencedFiles}`);
  console.log(`Canonical product path violations: ${summary.canonicalViolations}`);
  console.log(`Flat product files: ${summary.flatProductFiles}`);
  console.log(`Duplicate basenames: ${summary.duplicateBasenames}`);

  console.log('');
  console.log('Missing uploaded_files rows:');
  for (const line of formatSample(uploadedFileClassification.missing, (row) => {
    return `- ${row.filepath} (${row.entityType || 'none'} / ${row.filename})`;
  })) console.log(line);

  console.log('');
  console.log('Canonical product path violation samples:');
  for (const line of formatSample(uploadedFileClassification.canonicalViolations, (row) => {
    return `- ${row.filepath} -> ${row.expectedApiPath} (${row.entityType}, ${row.productModel || row.productName || 'unknown model'})`;
  })) console.log(line);

  console.log('');
  console.log('Unreferenced filesystem file samples:');
  for (const line of formatSample(inventory.unreferencedFiles, (relativePath) => {
    const absolutePath = path.join(uploadsRoot, relativePath);
    const size = fs.statSync(absolutePath).size;
    return `- ${publicApiPath(relativePath)} (${size} bytes)`;
  })) console.log(line);

  console.log('');
  console.log('Flat product file samples:');
  for (const line of formatSample(flatProductFiles, (relativePath) => `- ${publicApiPath(relativePath)}`)) {
    console.log(line);
  }

  console.log('');
  console.log('Legacy missing public signature samples:');
  for (const line of formatSample(inventory.legacyMissingSignaturePaths, (item) => {
    return `- ${publicApiPath(item.relativePath)} (${item.references.length} reference${item.references.length === 1 ? '' : 's'})`;
  })) console.log(line);

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    missingUploadedFileRows: uploadedFileClassification.missing,
    unsupportedUploadedFileRows: uploadedFileClassification.unsupported,
    missingReferencedPaths: inventory.missingReferencedPaths,
    legacyMissingSignaturePaths: inventory.legacyMissingSignaturePaths,
    unreferencedFiles: inventory.unreferencedFiles.map((relativePath) => ({
      relativePath,
      apiPath: publicApiPath(relativePath),
      size: fs.statSync(path.join(uploadsRoot, relativePath)).size,
      sha256: sha256File(path.join(uploadsRoot, relativePath)),
    })),
    canonicalViolations: uploadedFileClassification.canonicalViolations,
    flatProductFiles,
    duplicateBasenames,
  };

  if (jsonOutPath) {
    fs.mkdirSync(path.dirname(jsonOutPath), { recursive: true });
    fs.writeFileSync(jsonOutPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log('');
    console.log(`JSON report written: ${jsonOutPath}`);
  }

  if (
    summary.missingUploadedFileRows > 0 ||
    summary.unsupportedUploadedFileRows > 0 ||
    summary.missingReferencedPaths > 0 ||
    summary.canonicalViolations > 0
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
