import { Client } from 'pg';
import { dbTargets, detectSuspiciousText, resolveConnectionString } from './lib/text-integrity.mjs';

const repoRoot = process.cwd();

async function main() {
  const client = new Client({ connectionString: resolveConnectionString(repoRoot) });
  await client.connect();

  const findings = [];

  try {
    for (const target of dbTargets) {
      const selectList = [target.idColumn, ...target.columns]
        .map((column) => `"${column}"`)
        .join(', ');

      const result = await client.query(`SELECT ${selectList} FROM "${target.table}"`);

      for (const row of result.rows) {
        for (const column of target.columns) {
          const fragment = detectSuspiciousText(row[column]);
          if (!fragment) continue;

          findings.push({
            table: target.table,
            id: row[target.idColumn],
            column,
            fragment,
            sample: row[column].slice(0, 160),
          });
        }
      }
    }
  } finally {
    await client.end();
  }

  if (findings.length === 0) {
    console.log('No suspicious garbled DB copy found.');
    return;
  }

  console.error('Suspicious garbled DB copy found:\n');
  for (const finding of findings) {
    console.error(`${finding.table}.${finding.column} [${finding.id}] [${finding.fragment}] ${finding.sample}`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
