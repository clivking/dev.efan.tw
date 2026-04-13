#!/usr/bin/env node

console.error([
  'scripts/seed-soyal-fp-docs.js 已停用。',
  '原因：舊版 SOYAL 指紋產品文件匯入腳本含有亂碼與過期流程。',
  '如需重新匯入文件資料，請改用乾淨資料源與新腳本重建。',
].join('\n'));

process.exit(1);
