#!/usr/bin/env node

console.error([
  'scripts/seed-soyal-fingerprint.js 已停用。',
  '原因：舊版 SOYAL 指紋門禁 seed 內容含有嚴重亂碼與過期文案。',
  '如需重新建立資料，請以最新欄位規格重新整理來源內容。',
].join('\n'));

process.exit(1);
