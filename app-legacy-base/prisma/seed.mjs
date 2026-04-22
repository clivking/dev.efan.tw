import crypto from 'node:crypto';
import bcryptjs from 'bcryptjs';
import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function upsertAdminUser(username, password, name) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      username,
      passwordHash: await bcryptjs.hash(password, 12),
      name,
      role: 'admin',
      isActive: true,
    },
  });
}

const settingsData = [
  ['company_name', '逸帆科技整合有限公司', 'string', 'company', '公司名稱'],
  ['company_name_en', 'Efan Security Integration', 'string', 'company', 'Company name (English)'],
  ['tax_id', '', 'string', 'company', '統一編號'],
  ['company_address', '台北市內湖區瑞光路45號1樓', 'string', 'company', '公司地址'],
  ['company_phone', '02-7730-1158', 'string', 'company', '公司電話'],
  ['company_email', 'safekings@gmail.com', 'string', 'company', '公司 Email'],
  ['company_logo_url', '', 'string', 'company', '公司 Logo 圖片網址'],
  ['company_stamp_url', '', 'string', 'company', '公司印章圖片網址'],
  ['company_description', '', 'string', 'company', '公司簡介'],
  ['completed_case_count', '2600', 'number', 'company', '累積完成案例數'],
  ['quote_valid_days', '60', 'number', 'quote', '報價單有效天數'],
  ['default_tax_rate', '5', 'number', 'quote', '預設稅率 (%)'],
  ['tax_extra_rate', '3', 'number', 'quote', '外加稅率 (%)'],
  ['quote_start_sequence', '6', 'number', 'quote', '報價流水號起始值'],
  ['customer_start_sequence', '1', 'number', 'quote', '客戶流水號起始值'],
  ['allow_delete_status', '["draft","confirmed","sent"]', 'json', 'quote', '允許刪除的報價狀態'],
  ['show_customer_note_on_pdf', 'true', 'boolean', 'ui', 'PDF 顯示客戶備註'],
  ['remove_hidden_items_for_delivery', 'true', 'boolean', 'document', '出貨單移除隱藏項目'],
  ['remove_hidden_items_for_warranty', 'true', 'boolean', 'document', '保固書移除隱藏項目'],
  ['ai_api_key', '', 'encrypted', 'api', 'Legacy AI API Key'],
  ['telegram_bot_token', '', 'encrypted', 'telegram', 'Telegram Bot Token'],
  ['telegram_chat_id', '', 'string', 'telegram', '報價通知 Telegram Chat ID'],
  ['dashboard_month_range', '12', 'number', 'dashboard', '儀表板月份範圍'],
  ['max_import_rows', '1000', 'number', 'import_export', '匯入最大筆數'],
  ['allow_overwrite_on_import', 'false', 'boolean', 'import_export', '匯入時允許覆寫'],
  ['enable_inventory', 'true', 'boolean', 'inventory', '啟用庫存功能'],
  ['low_stock_warning', '5', 'number', 'inventory', '低庫存警戒值'],
  ['max_quote_variants', '5', 'number', 'variant', '最多報價方案數'],
  ['enable_view_tracking', 'true', 'boolean', 'quote', '啟用報價瀏覽追蹤'],
  ['warranty_terms', '1. 保固依實際產品與工程項目為準。\n2. 人為損壞、天災與外力破壞不在保固範圍。\n3. 若有維修需求，請先聯繫客服安排。\n4. 服務電話：02-7730-1158。', 'string', 'document', '保固條款'],
  ['delivery_note_footer', '', 'string', 'document', '出貨單頁尾備註'],
  ['invoice_note_footer', '', 'string', 'document', '發票頁尾備註'],
  ['bank_account_info', '{}', 'json', 'company', '銀行帳戶資訊'],
  ['ai_provider', 'gemini', 'string', 'ai', 'AI provider'],
  ['ai_gemini_api_key', '', 'encrypted', 'ai', 'Google Gemini API Key'],
  ['ai_gemini_model', 'gemini-2.0-flash', 'string', 'ai', 'Gemini model'],
  ['ai_openai_api_key', '', 'encrypted', 'ai', 'OpenAI API Key'],
  ['ai_openai_model', 'gpt-4o', 'string', 'ai', 'OpenAI model'],
  ['ai_max_tokens', '2000', 'number', 'ai', 'AI max output tokens'],
  ['ai_temperature', '0.7', 'number', 'ai', 'AI temperature'],
  ['ai_chat_enabled', 'true', 'boolean', 'ai', '啟用 AI 客服'],
  ['ai_chat_welcome_message', '您好，這裡是逸帆科技整合 AI 助理。請告訴我您的需求，我會先協助整理資訊。', 'string', 'ai', 'AI 客服歡迎訊息'],
  ['ai_chat_transfer_message', '我已經整理好需求，稍後將由真人同事協助您。', 'string', 'ai', '轉真人訊息'],
  ['ai_chat_offline_message', '目前客服系統忙碌中，請留下需求或直接來電，我們會盡快與您聯繫。', 'string', 'ai', 'AI 離線訊息'],
  ['ai_chat_max_history', '20', 'number', 'ai', 'AI 對話最大歷史筆數'],
  ['ai_monthly_budget', '10', 'number', 'ai', 'AI monthly budget (USD)'],
  ['telegram_chat_id_customer_service', '', 'string', 'telegram', 'AI 客服 Telegram Chat ID'],
  ['security_login_failure_window_minutes', '15', 'number', 'security', '登入失敗計算時間窗（分鐘）'],
  ['security_login_failure_attempt_limit', '5', 'number', 'security', '同帳號或 IP 在時間窗內最多允許失敗次數'],
  ['security_login_lock_minutes', '30', 'number', 'security', '超過登入失敗次數後的暫時鎖定分鐘數'],
  ['security_alert_new_ip_login', 'true', 'boolean', 'security', '新 IP 登入時發送 Telegram 告警'],
  ['security_alert_failed_login_burst', 'true', 'boolean', 'security', '短時間大量登入失敗時發送 Telegram 告警'],
  ['security_failed_login_burst_threshold', '5', 'number', 'security', '短時間登入失敗告警門檻'],
  ['security_alert_off_hours_login', 'true', 'boolean', 'security', '離峰時段登入時發送 Telegram 告警'],
  ['security_off_hours_start', '22:00', 'string', 'security', '離峰時段開始時間（24 小時制）'],
  ['security_off_hours_end', '06:00', 'string', 'security', '離峰時段結束時間（24 小時制）'],
  ['security_session_days', '30', 'number', 'security', '管理後台登入 session 保留天數'],
  ['audit_retention_security_days', '365', 'number', 'security', '安全稽核紀錄保留天數'],
  ['audit_retention_general_days', '180', 'number', 'security', '一般稽核紀錄保留天數'],
  ['audit_retention_last_run_at', '', 'string', 'security', '最近一次稽核清理時間（系統維護用）'],
];

const obsoleteSettingKeys = new Set([
  'remind_unviewed_days',
  'remind_viewed_unsigned_days',
  'remind_warranty_before_days',
  'remind_unpaid_days',
  'transport_free_km',
  'transport_per_km_unit',
  'transport_per_unit_fee',
  'transport_base_address',
  'hide_empty_customer_fields',
  'show_internal_note_default',
  'default_warranty_months',
  'google_maps_api_key',
  'smtp_config',
  'audit_retention_days',
  'allow_edit_signed_quote',
  'allow_edit_paid_quote',
  'dashboard_recent_limit',
  'default_variant_names',
  'default_recommended',
  'signature_required_fields',
  'signature_canvas_width',
  'signature_canvas_height',
  'telegram_notify_events',
  'warranty_start_event',
  'ai_claude_api_key',
  'ai_claude_model',
]);

async function main() {
  console.log('Seeding users, settings, and base categories...');

  await upsertAdminUser('cliv', '0982', 'Cliv');
  console.log('Created admin user: cliv');

  await upsertAdminUser('yuny', '0980', 'Yuny');
  console.log('Created admin user: yuny');

  const existingSystem = await prisma.user.findUnique({ where: { username: 'system' } });
  if (!existingSystem) {
    await prisma.user.create({
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'system',
        passwordHash: await bcryptjs.hash(crypto.randomUUID(), 12),
        name: 'System',
        role: 'staff',
        isActive: true,
      },
    });
    console.log('Created system user.');
  }

  const activeSettingsData = settingsData.filter(([key]) => !obsoleteSettingKeys.has(key));
  for (const [key, value, type, category, description] of activeSettingsData) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value, type, category, description },
    });
  }
  console.log(`Upserted ${activeSettingsData.length} active settings.`);

  const categories = ['監視系統', '門禁系統', '電話總機', '網路設備', '其他'];
  for (const [index, name] of categories.entries()) {
    const existing = await prisma.productCategory.findFirst({ where: { name } });
    if (existing) {
      await prisma.productCategory.update({ where: { id: existing.id }, data: { sortOrder: index } });
      continue;
    }
    await prisma.productCategory.create({ data: { name, sortOrder: index } });
  }
  console.log(`Upserted ${categories.length} base product categories.`);
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
