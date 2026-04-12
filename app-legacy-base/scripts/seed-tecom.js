#!/usr/bin/env node

console.error([
  'scripts/seed-tecom.js 已停用。',
  '原因：舊版東訊產品 seed 內容長期混入亂碼，已不適合直接匯入網站資料。',
  '如需重新匯入東訊資料，請改用乾淨資料源與新腳本重建。',
].join('\n'));

process.exit(1);
