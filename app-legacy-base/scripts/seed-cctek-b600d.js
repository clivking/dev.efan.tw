#!/usr/bin/env node

console.error([
  'scripts/seed-cctek-b600d.js 已停用。',
  '原因：舊版 CCTEK B600D seed 內容含有嚴重亂碼與過期欄位。',
  '如需重建資料，請改用目前產品 schema 重新整理後再匯入。',
].join('\n'));

process.exit(1);
