const crypto = require('crypto');
const fs = require('fs');
const { Client } = require('pg');

const SETTINGS_TO_SEED = [
  [
    'enable_view_tracking',
    'true',
    'boolean',
    'quote',
    '啟用客戶瀏覽追蹤',
  ],
  [
    'warranty_terms',
    [
      '1. 保固自完工日起算。',
      '2. 非人為損壞可依保固內容提供維修。',
      '3. 若為耗材或外力造成損壞，另行報價。',
      '4. 如需協助請聯絡 02-7730-1158。',
    ].join('\n'),
    'string',
    'document',
    '保固條款內容',
  ],
  [
    'delivery_note_footer',
    '',
    'string',
    'document',
    '出貨單頁尾備註',
  ],
  [
    'invoice_note_footer',
    '',
    'string',
    'document',
    '請款單頁尾備註',
  ],
  [
    'bank_account_info',
    '{}',
    'json',
    'company',
    '收款帳戶資訊',
  ],
];

function readDatabaseUrl() {
  const envFile = fs.readFileSync('.env', 'utf8');
  const match = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);

  if (!match) {
    console.error('在 .env 中找不到 DATABASE_URL');
    process.exit(1);
  }

  return match[1].split('?')[0];
}

async function seedSettings() {
  const client = new Client({ connectionString: readDatabaseUrl() });
  await client.connect();

  try {
    for (const [key, value, type, category, description] of SETTINGS_TO_SEED) {
      const existing = await client.query(
        'SELECT 1 FROM settings WHERE key = $1',
        [key],
      );

      if (existing.rowCount > 0) {
        console.log(`略過既有設定：${key}`);
        continue;
      }

      const id = crypto.randomUUID();
      const now = new Date();

      await client.query(
        `
          INSERT INTO settings (
            id,
            key,
            value,
            type,
            category,
            description,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4::"SettingType", $5, $6, $7, $8)
        `,
        [id, key, value, type, category, description, now, now],
      );

      console.log(`已新增設定：${key}`);
    }

    console.log('系統設定已透過 pg 直連補齊完成。');
  } catch (error) {
    console.error('設定初始化失敗：', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seedSettings();
