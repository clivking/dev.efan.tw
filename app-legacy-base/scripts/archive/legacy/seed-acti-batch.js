#!/usr/bin/env node

console.error([
  'scripts/seed-acti-batch.js 已停用。',
  '原因：舊版 ACTi 批次 seed 內容混入亂碼，且資料結構已不符合目前系統。',
  '若要重新匯入 ACTi 批次資料，請以最新欄位設計另建 seed 腳本。',
].join('\n'));

process.exit(1);
