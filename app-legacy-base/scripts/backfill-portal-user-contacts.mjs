import 'dotenv/config';
import { Client } from 'pg';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString });
  await client.connect();

  const usersRes = await client.query(`
    select
      pu.id,
      pu.customer_id,
      pu.username,
      pu.display_name
    from portal_users pu
    where pu.contact_id is null
    order by pu.created_at asc
  `);

  let updated = 0;

  for (const user of usersRes.rows) {
    const contactsRes = await client.query(`
      select
        c.id,
        c.name,
        c.email,
        c.mobile,
        c.is_primary,
        c.sort_order
      from contacts c
      where c.customer_id = $1
      order by c.is_primary desc, c.sort_order asc, c.created_at asc
    `, [user.customer_id]);

    const contacts = contactsRes.rows;
    if (!contacts.length) {
      console.warn(`[skip] ${user.username}: customer has no contacts`);
      continue;
    }

    const byEmail = contacts.find((contact) => normalize(contact.email) && normalize(contact.email) === normalize(user.username));
    const byMobile = contacts.find((contact) => cleanDigits(contact.mobile) && cleanDigits(contact.mobile) === cleanDigits(user.username));
    const byName = contacts.find((contact) => normalize(contact.name) === normalize(user.display_name));
    const target = byEmail || byMobile || byName || contacts[0];

    const conflictRes = await client.query(`
      select id, username
      from portal_users
      where contact_id = $1
        and id <> $2
      limit 1
    `, [target.id, user.id]);

    if (conflictRes.rows.length > 0) {
      console.warn(`[skip] ${user.username}: contact ${target.name} already linked to ${conflictRes.rows[0].username}`);
      continue;
    }

    await client.query(`
      update portal_users
      set contact_id = $1
      where id = $2
    `, [target.id, user.id]);

    updated += 1;
    console.log(`[ok] ${user.username} -> ${target.name}`);
  }

  console.log(`Backfill complete. Updated ${updated} portal users.`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
