import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGETS = ['src', 'prisma', 'scripts', 'docs', 'README.md'];
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.sql']);
const IGNORED_PATH_PARTS = new Set(['node_modules', '.next', '.git', 'src/generated/prisma']);
const IGNORED_FILES = new Set([
  'scripts/check-encoding.mjs',
  'scripts/scan-garbled-copy.mjs',
  'scripts/scan-garbled-db.mjs',
  'scripts/repair-garbled-db.mjs',
  'scripts/lib/text-integrity.mjs',
]);
const SUSPICIOUS_FRAGMENTS = [
  '\uFFFD',
  '?Ｗ',
  '撌',
  '瘥',
  '閬',
  '隤',
  '蝬',
  '銝',
  '擐',
  '甈',
  '靘',
  '敹',
  '瑼',
  '??',
];
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

function shouldIgnorePath(relativePath) {
  if (IGNORED_FILES.has(relativePath)) return true;
  return [...IGNORED_PATH_PARTS].some((part) => relativePath.includes(part));
}

function walk(targetPath, collected = []) {
  if (!fs.existsSync(targetPath)) return collected;

  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      const fullPath = path.join(targetPath, entry.name);
      const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
      if (shouldIgnorePath(relativePath)) continue;

      if (entry.isDirectory()) {
        walk(fullPath, collected);
        continue;
      }

      if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
        collected.push(fullPath);
      }
    }
    return collected;
  }

  if (TEXT_EXTENSIONS.has(path.extname(targetPath)) || path.basename(targetPath) === 'README.md') {
    collected.push(targetPath);
  }

  return collected;
}

function validateUtf8(buffer, relativePath, findings) {
  try {
    UTF8_DECODER.decode(buffer);
  } catch {
    findings.push({
      file: relativePath,
      line: 1,
      fragment: 'invalid_utf8',
      text: 'File could not be decoded as strict UTF-8.',
    });
    return false;
  }

  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    findings.push({
      file: relativePath,
      line: 1,
      fragment: 'utf8_bom',
      text: 'UTF-8 BOM detected. Save the file as UTF-8 without BOM.',
      severity: 'warning',
    });
  }

  return true;
}

const findings = [];

for (const target of TARGETS) {
  const targetPath = path.join(ROOT, target);
  for (const filePath of walk(targetPath)) {
    const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
    if (shouldIgnorePath(relativePath)) continue;

    const buffer = fs.readFileSync(filePath);
    const isValidUtf8 = validateUtf8(buffer, relativePath, findings);
    if (!isValidUtf8) continue;

    const content = buffer.toString('utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const fragment = SUSPICIOUS_FRAGMENTS.find((item) => line.includes(item));
      if (!fragment) return;

      findings.push({
        file: relativePath,
        line: index + 1,
        fragment,
        text: line.trim().slice(0, 160),
      });
    });
  }
}

const errors = findings.filter((finding) => finding.severity !== 'warning');
const warnings = findings.filter((finding) => finding.severity === 'warning');

if (warnings.length > 0) {
  console.warn('Encoding warnings:\n');
  for (const warning of warnings) {
    console.warn(`${warning.file}:${warning.line} [${warning.fragment}] ${warning.text}`);
  }
  console.warn('');
}

if (errors.length > 0) {
  console.error('Encoding check failed. Suspicious encoding issues found:\n');
  for (const finding of errors) {
    console.error(`${finding.file}:${finding.line} [${finding.fragment}] ${finding.text}`);
  }
  process.exit(1);
}

console.log('Encoding check passed.');
