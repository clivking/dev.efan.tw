#!/usr/bin/env node

console.error([
  'scripts/seed-acti-products.js 已停用。',
  '原因：舊版 ACTi 產品 seed 內容含有嚴重亂碼與過期欄位配置。',
  '如需重新匯入，請改用新的產品資料來源與乾淨的 seed 腳本重建。',
].join('\n'));

process.exit(1);
