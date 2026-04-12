import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { detectSuspiciousText, getTargetConfig, resolveConnectionString } from './lib/text-integrity.mjs';

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, 'tmp', 'garbled-db-reports');

function parseArgs(argv) {
  const parsed = {
    apply: false,
    table: '',
    id: '',
    column: '',
    from: '',
    to: '',
    rulesFile: '',
    reportFile: '',
  };

  for (const arg of argv) {
    if (arg === '--apply') parsed.apply = true;
    else if (arg.startsWith('--table=')) parsed.table = arg.slice('--table='.length);
    else if (arg.startsWith('--id=')) parsed.id = arg.slice('--id='.length);
    else if (arg.startsWith('--column=')) parsed.column = arg.slice('--column='.length);
    else if (arg.startsWith('--from=')) parsed.from = arg.slice('--from='.length);
    else if (arg.startsWith('--to=')) parsed.to = arg.slice('--to='.length);
    else if (arg.startsWith('--rules=')) parsed.rulesFile = arg.slice('--rules='.length);
    else if (arg.startsWith('--report=')) parsed.reportFile = arg.slice('--report='.length);
  }

  return parsed;
}

function ensureReportsDir() {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function resolveReportPath(customPath = '') {
  ensureReportsDir();
  if (customPath) return path.resolve(repoRoot, customPath);
  return path.join(reportsDir, `repair-garbled-db-${buildTimestamp()}.json`);
}

function writeReport(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function loadRules(rulesFile) {
  if (!rulesFile) return [];
  const absolutePath = path.resolve(repoRoot, rulesFile);
  const raw = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('Rules file must contain an array.');
  return raw;
}

function buildRulesFromArgs(args) {
  if (!args.table && !args.rulesFile) return [];
  if (!args.rulesFile && (!args.table || !args.id || !args.column || !args.from || args.to === '')) {
    throw new Error('Single-row repair requires --table, --id, --column, --from, and --to.');
  }
  if (args.rulesFile) return loadRules(args.rulesFile);
  return [{
    table: args.table,
    id: args.id,
    column: args.column,
    from: args.from,
    to: args.to,
  }];
}

async function previewCurrentValue(client, rule) {
  const target = getTargetConfig(rule.table, rule.column);
  const result = await client.query(
    `SELECT "${target.idColumn}" AS id, "${rule.column}" AS value FROM "${rule.table}" WHERE "${target.idColumn}" = $1`,
    [rule.id]
  );
  return result.rows[0] || null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rules = buildRulesFromArgs(args);
  const reportPath = resolveReportPath(args.reportFile);

  if (rules.length === 0) {
    writeReport(reportPath, {
      mode: 'empty',
      createdAt: new Date().toISOString(),
      rules: [],
      results: [],
      message: 'No repair rules provided.',
    });

    console.log('No repair rules provided.');
    console.log('Use: node scripts/repair-garbled-db.mjs --table=<table> --id=<id> --column=<column> --from=<bad> --to=<good> [--apply]');
    console.log('Or:  node scripts/repair-garbled-db.mjs --rules=path/to/rules.json [--apply]');
    console.log(`Report: ${path.relative(repoRoot, reportPath)}`);
    return;
  }

  const client = new Client({ connectionString: resolveConnectionString(repoRoot) });
  await client.connect();

  const prepared = [];

  try {
    for (const rule of rules) {
      getTargetConfig(rule.table, rule.column);

      const current = await previewCurrentValue(client, rule);
      if (!current) {
        prepared.push({ ...rule, status: 'missing_row' });
        continue;
      }

      if (typeof current.value !== 'string') {
        prepared.push({ ...rule, status: 'non_text_value' });
        continue;
      }

      if (!current.value.includes(rule.from)) {
        prepared.push({ ...rule, status: 'from_not_found', currentValue: current.value });
        continue;
      }

      const nextValue = current.value.replaceAll(rule.from, rule.to);
      prepared.push({
        ...rule,
        status: 'ready',
        currentValue: current.value,
        nextValue,
        suspiciousBefore: detectSuspiciousText(current.value),
        suspiciousAfter: detectSuspiciousText(nextValue),
      });
    }

    const ready = prepared.filter((item) => item.status === 'ready');

    if (!args.apply) {
      writeReport(reportPath, {
        mode: 'dry-run',
        createdAt: new Date().toISOString(),
        rules,
        results: prepared,
      });

      console.log('Dry run only. No database changes were made.\n');
      for (const item of prepared) {
        console.log(`[${item.status}] ${item.table}.${item.column} [${item.id}]`);
        if (item.currentValue) console.log(`current: ${item.currentValue.slice(0, 160)}`);
        if (item.nextValue) console.log(`next:    ${item.nextValue.slice(0, 160)}`);
        console.log('');
      }
      console.log(`Report: ${path.relative(repoRoot, reportPath)}`);
      return;
    }

    await client.query('BEGIN');
    for (const item of ready) {
      const target = getTargetConfig(item.table, item.column);
      await client.query(
        `UPDATE "${item.table}" SET "${item.column}" = $1 WHERE "${target.idColumn}" = $2`,
        [item.nextValue, item.id]
      );
    }
    await client.query('COMMIT');

    writeReport(reportPath, {
      mode: 'apply',
      createdAt: new Date().toISOString(),
      rules,
      results: prepared,
      backups: prepared
        .filter((item) => item.currentValue !== undefined)
        .map((item) => ({
          table: item.table,
          id: item.id,
          column: item.column,
          previousValue: item.currentValue,
          nextValue: item.nextValue,
        })),
    });

    console.log(`Applied ${ready.length} repair update(s).`);
    for (const item of prepared) {
      console.log(`[${item.status}] ${item.table}.${item.column} [${item.id}]`);
    }
    console.log(`Report: ${path.relative(repoRoot, reportPath)}`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
