import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const defaultRoots = ['src', 'prisma', 'scripts', 'docs', 'README.md'];
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.sql']);
const ignoredFiles = new Set([
  'scripts/check-encoding.mjs',
  'scripts/scan-garbled-copy.mjs',
  'scripts/scan-garbled-db.mjs',
  'scripts/repair-garbled-db.mjs',
  'scripts/lib/text-integrity.mjs',
]);
const ignoredPathParts = new Set(['node_modules', '.next', '.git', 'src/generated/prisma', 'src/generated/prisma-v7']);
const suspiciousTokens = [
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
const suspiciousRegexes = [
  /\?\?/,
  /[\uE000-\uF8FF]/,
];

const ignoreSubstrings = [
  'seoRatingValue ??',
  'seoRatingCount ??',
  'sortOrder ??',
  'imageMap.get(',
  'idToOrder.get(',
  'row.value ??',
  'process.env.',
  '?.',
  'https://',
  'http://',
  '/api/',
  '?token=',
  '?path=',
  '?provider=',
  '?search=',
  '?page=',
  '?mode=',
];

function shouldIgnorePath(relativePath) {
  if (ignoredFiles.has(relativePath)) return true;
  return [...ignoredPathParts].some((part) => relativePath.includes(part));
}

function shouldIgnoreLine(line) {
  return ignoreSubstrings.some((token) => line.includes(token));
}

function extractLiterals(line) {
  return line.match(/(['"`])(?:\\.|(?!\1).)*\1/g) || [];
}

function isSuspiciousLiteral(literal) {
  if (suspiciousTokens.some((token) => literal.includes(token))) return true;

  return suspiciousRegexes.some((regex) => {
    if (regex.source === '\\?\\?') {
      return literal.includes('??')
        && !literal.includes('http')
        && !literal.includes('/api/')
        && !literal.includes('${')
        && !literal.includes(' ?? ');
    }
    return regex.test(literal);
  });
}

function scanFile(filePath, findings) {
  const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  if (shouldIgnorePath(relativePath)) return;

  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (shouldIgnoreLine(line)) return;

    const literals = extractLiterals(line);
    const quotedHit = literals.find((literal) => isSuspiciousLiteral(literal));

    if (quotedHit) {
      findings.push({
        file: filePath,
        line: index + 1,
        sample: quotedHit,
      });
      return;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (trimmed.includes('>') && (suspiciousTokens.some((token) => trimmed.includes(token)) || /[\uE000-\uF8FF]/.test(trimmed))) {
      findings.push({
        file: filePath,
        line: index + 1,
        sample: trimmed,
      });
    }
  });
}

function walk(targetPath, findings) {
  if (!fs.existsSync(targetPath)) return;

  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      const fullPath = path.join(targetPath, entry.name);
      const relativePath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
      if (shouldIgnorePath(relativePath)) continue;
      walk(fullPath, findings);
    }
    return;
  }

  if (!exts.has(path.extname(targetPath)) && path.basename(targetPath) !== 'README.md') return;
  scanFile(targetPath, findings);
}

const roots = process.argv.length > 2 ? process.argv.slice(2) : defaultRoots;
const findings = [];

for (const root of roots) {
  walk(path.resolve(repoRoot, root), findings);
}

if (findings.length === 0) {
  console.log('No suspicious garbled copy found.');
  process.exit(0);
}

for (const finding of findings) {
  console.log(`${path.relative(repoRoot, finding.file)}:${finding.line}: ${finding.sample}`);
}

process.exitCode = 1;
