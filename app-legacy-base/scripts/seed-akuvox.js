#!/usr/bin/env node

console.error([
  'scripts/seed-akuvox.js 已停用。',
  '原因：舊版 Akuvox 批次 seed 內容含有亂碼與過期文案。',
  '如需重新匯入 Akuvox 資料，請以目前網站欄位重新建立乾淨腳本。',
].join('\n'));

process.exit(1);
