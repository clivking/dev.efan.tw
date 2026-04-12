#!/usr/bin/env node

console.error([
  'scripts/seed-soyal-batch2.js 已停用。',
  '原因：舊版 SOYAL 批次 seed 含有亂碼與過期文案。',
  '如需重新匯入，請依現行產品欄位拆分資料後另建腳本。',
].join('\n'));

process.exit(1);
