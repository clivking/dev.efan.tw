#!/usr/bin/env node

console.error([
  'scripts/seed-soyal-locks.js 已停用。',
  '原因：舊版 SOYAL 電鎖產品 seed 長期混入亂碼，且欄位配置已過時。',
  '如需重新匯入，請依目前產品資料模型重新建立 seed 腳本。',
].join('\n'));

process.exit(1);
