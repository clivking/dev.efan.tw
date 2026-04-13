-- ========== Phase 17B + AI + Telegram + Security settings seed ==========
-- System user
INSERT INTO users (id, username, password_hash, name, role, is_active, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'system', 'SYSTEM_NO_LOGIN', 'System', 'admin', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- AI Engine settings
INSERT INTO settings (id, key, value, type, category, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'ai_provider', 'gemini', 'string', 'ai', '目前使用的 AI 供應商', NOW(), NOW()),
(gen_random_uuid(), 'ai_gemini_api_key', '', 'encrypted', 'ai', 'Google Gemini API Key', NOW(), NOW()),
(gen_random_uuid(), 'ai_gemini_model', 'gemini-2.0-flash', 'string', 'ai', 'Gemini 模型', NOW(), NOW()),
(gen_random_uuid(), 'ai_claude_api_key', '', 'encrypted', 'ai', 'Anthropic Claude API Key', NOW(), NOW()),
(gen_random_uuid(), 'ai_claude_model', 'claude-sonnet-4-20250514', 'string', 'ai', 'Claude 模型', NOW(), NOW()),
(gen_random_uuid(), 'ai_openai_api_key', '', 'encrypted', 'ai', 'OpenAI ChatGPT API Key', NOW(), NOW()),
(gen_random_uuid(), 'ai_openai_model', 'gpt-4o', 'string', 'ai', 'OpenAI 模型', NOW(), NOW()),
(gen_random_uuid(), 'ai_max_tokens', '2000', 'number', 'ai', '回應最大 token 數', NOW(), NOW()),
(gen_random_uuid(), 'ai_temperature', '0.7', 'number', 'ai', '創意度 (0-1)', NOW(), NOW()),
(gen_random_uuid(), 'ai_monthly_budget', '10', 'number', 'ai', '每月預算上限 (USD)', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_enabled', 'true', 'boolean', 'ai', '啟用 AI 客服', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_welcome_message', '您好！我是一帆的 AI 客服，有什麼可以幫您的嗎？😊', 'string', 'ai', 'AI 客服歡迎訊息', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_transfer_message', '正在為您轉接專人，請稍候...', 'string', 'ai', '轉接提示訊息', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_offline_message', '目前專人不在線上，請留下聯絡方式，我們會盡快回覆您。', 'string', 'ai', '離線提示訊息', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_max_history', '20', 'number', 'ai', '傳送給 AI 的最大歷史訊息數', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Telegram settings
INSERT INTO settings (id, key, value, type, category, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'telegram_bot_token', '', 'encrypted', 'telegram', 'Telegram Bot Token', NOW(), NOW()),
(gen_random_uuid(), 'telegram_chat_id', '', 'string', 'telegram', '報價通知 Chat ID', NOW(), NOW()),
(gen_random_uuid(), 'telegram_notify_events', '["quote_viewed","quote_signed","quote_paid","new_contact_request"]', 'json', 'telegram', '通知事件', NOW(), NOW()),
(gen_random_uuid(), 'telegram_chat_id_customer_service', '', 'string', 'telegram', '客服通知 Chat ID', NOW(), NOW()),
(gen_random_uuid(), 'telegram_webhook_secret', '', 'string', 'telegram', 'Webhook Secret', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Security / Turnstile
INSERT INTO settings (id, key, value, type, category, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'turnstile_site_key', '', 'string', 'security', 'Cloudflare Turnstile Site Key', NOW(), NOW()),
(gen_random_uuid(), 'turnstile_secret_key', '', 'encrypted', 'security', 'Cloudflare Turnstile Secret Key', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Phase 17B consultation settings
INSERT INTO settings (id, key, value, type, category, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'business_hours_start', '09:00', 'string', 'company', '營業開始時間', NOW(), NOW()),
(gen_random_uuid(), 'business_hours_end', '18:00', 'string', 'company', '營業結束時間', NOW(), NOW()),
(gen_random_uuid(), 'business_days', '[1,2,3,4,5]', 'json', 'company', '營業日', NOW(), NOW()),
(gen_random_uuid(), 'chat_idle_prompt_seconds', '60', 'number', 'ui', '聊天閒置提示秒數', NOW(), NOW()),
(gen_random_uuid(), 'chat_session_resume_minutes', '60', 'number', 'ui', '聊天關閉後可恢復分鐘數', NOW(), NOW()),
(gen_random_uuid(), 'line_qrcode_url', '', 'string', 'company', 'LINE QR Code', NOW(), NOW()),
(gen_random_uuid(), 'line_official_id', '', 'string', 'company', 'LINE ID', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
