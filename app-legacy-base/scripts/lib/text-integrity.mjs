import fs from 'node:fs';
import path from 'node:path';

export const suspiciousTokens = [
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

export const dbTargets = [
  { table: 'settings', idColumn: 'id', columns: ['value', 'description'] },
  { table: 'products', idColumn: 'id', columns: ['name', 'description', 'quote_name', 'quote_desc', 'website_description', 'notes'] },
  { table: 'quote_templates', idColumn: 'id', columns: ['name', 'notes', 'internal_note', 'customer_note', 'discount_note'] },
  { table: 'template_items', idColumn: 'id', columns: ['name', 'description', 'unit', 'internal_note', 'customer_note'] },
  { table: 'quotes', idColumn: 'id', columns: ['name', 'name_en', 'internal_note', 'customer_note', 'discount_note', 'completion_note'] },
  { table: 'pages', idColumn: 'id', columns: ['title', 'rich_content', 'seo_title', 'seo_description'] },
];

export function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/i);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
  }
  return values;
}

export function resolveConnectionString(repoRoot) {
  const composeEnv = loadEnvFile(path.join(repoRoot, '.env.compose'));
  const localEnv = loadEnvFile(path.join(repoRoot, '.env'));
  let connectionString = process.env.DATABASE_URL || localEnv.DATABASE_URL || composeEnv.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in process.env, .env, or .env.compose');
  }

  const url = new URL(connectionString);
  if (url.hostname === 'db') {
    url.hostname = '127.0.0.1';
    url.port = '5434';
  }
  return url.toString();
}

export function detectSuspiciousText(value) {
  if (typeof value !== 'string' || !value) return null;
  return suspiciousTokens.find((token) => value.includes(token)) || null;
}

export function getTargetConfig(table, column = null) {
  const target = dbTargets.find((entry) => entry.table === table);
  if (!target) {
    throw new Error(`Unsupported table "${table}". Allowed: ${dbTargets.map((entry) => entry.table).join(', ')}`);
  }
  if (column && !target.columns.includes(column)) {
    throw new Error(`Unsupported column "${column}" for table "${table}". Allowed: ${target.columns.join(', ')}`);
  }
  return target;
}
