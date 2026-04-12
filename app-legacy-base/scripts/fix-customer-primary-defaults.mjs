import 'dotenv/config';
import { Client } from 'pg';
import { resolveConnectionString } from './lib/text-integrity.mjs';

const repoRoot = new URL('..', import.meta.url);

const SQL = `
WITH ranked AS (
  SELECT id, customer_id,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY is_primary DESC, sort_order ASC, created_at ASC, id ASC) AS rn,
         BOOL_OR(is_primary) OVER (PARTITION BY customer_id) AS has_primary
  FROM company_names
), fixed_companies AS (
  UPDATE company_names c
  SET is_primary = TRUE
  FROM ranked r
  WHERE c.id = r.id AND r.rn = 1 AND NOT r.has_primary
  RETURNING c.id
), ranked_contacts AS (
  SELECT id, customer_id,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY is_primary DESC, sort_order ASC, created_at ASC, id ASC) AS rn,
         BOOL_OR(is_primary) OVER (PARTITION BY customer_id) AS has_primary
  FROM contacts
), fixed_contacts AS (
  UPDATE contacts c
  SET is_primary = TRUE
  FROM ranked_contacts r
  WHERE c.id = r.id AND r.rn = 1 AND NOT r.has_primary
  RETURNING c.id
), ranked_locations AS (
  SELECT id, customer_id,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY is_primary DESC, sort_order ASC, created_at ASC, id ASC) AS rn,
         BOOL_OR(is_primary) OVER (PARTITION BY customer_id) AS has_primary
  FROM locations
), fixed_locations AS (
  UPDATE locations l
  SET is_primary = TRUE
  FROM ranked_locations r
  WHERE l.id = r.id AND r.rn = 1 AND NOT r.has_primary
  RETURNING l.id
)
SELECT
  (SELECT count(*) FROM customers WHERE NOT is_deleted) AS customer_count,
  (SELECT count(*) FROM fixed_companies) AS fixed_companies,
  (SELECT count(*) FROM fixed_contacts) AS fixed_contacts,
  (SELECT count(*) FROM fixed_locations) AS fixed_locations;
`;

async function main() {
  const client = new Client({ connectionString: resolveConnectionString(new URL('.', repoRoot).pathname) });
  await client.connect();

  try {
    const result = await client.query(SQL);
    const row = result.rows[0] ?? {};
    console.log(`Scanned ${row.customer_count ?? 0} customers.`);
    console.log(`Fixed primary companies: ${row.fixed_companies ?? 0}`);
    console.log(`Fixed primary contacts: ${row.fixed_contacts ?? 0}`);
    console.log(`Fixed primary locations: ${row.fixed_locations ?? 0}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
