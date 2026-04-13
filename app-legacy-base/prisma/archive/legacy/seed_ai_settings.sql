INSERT INTO settings (id, key, value, type, category, description, created_at, updated_at) VALUES
(gen_random_uuid(), 'ai_provider', 'gemini', 'string', 'ai', '目前使用的 AI 供應商 (gemini / claude / openai)', NOW(), NOW()),
(gen_random_uuid(), 'ai_gemini_api_key', '', 'encrypted', 'ai', 'Google Gemini API Key', NOW(), NOW()),
(gen_random_uuid(), 'ai_gemini_model', 'gemini-2.0-flash', 'string', 'ai', 'Gemini 模型', NOW(), NOW()),
(gen_random_uuid(), 'ai_claude_api_key', '', 'encrypted', 'ai', 'Anthropic Claude API Key', NOW(), NOW()),
(gen_random_uuid(), 'ai_claude_model', 'claude-sonnet-4-20250514', 'string', 'ai', 'Claude 模型', NOW(), NOW()),
(gen_random_uuid(), 'ai_openai_api_key', '', 'encrypted', 'ai', 'OpenAI ChatGPT API Key', NOW(), NOW()),
(gen_random_uuid(), 'ai_openai_model', 'gpt-4o', 'string', 'ai', 'OpenAI 模型', NOW(), NOW()),
(gen_random_uuid(), 'ai_max_tokens', '2000', 'number', 'ai', '回應最大 token 數', NOW(), NOW()),
(gen_random_uuid(), 'ai_temperature', '0.7', 'number', 'ai', '創意度 (0-1)', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_enabled', 'true', 'boolean', 'ai', '啟用 AI 客服', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_welcome_message', '您好！我是一帆的 AI 客服，有什麼可以幫您的嗎？😊', 'string', 'ai', 'AI 客服歡迎訊息', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_transfer_message', '正在為您轉接專人，請稍候...', 'string', 'ai', '轉接提示訊息', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_offline_message', '目前專人不在線上，請留下聯絡方式，我們會盡快回覆您。', 'string', 'ai', '離線提示訊息', NOW(), NOW()),
(gen_random_uuid(), 'ai_chat_max_history', '20', 'number', 'ai', '傳送給 AI 的最大歷史訊息數', NOW(), NOW()),
(gen_random_uuid(), 'telegram_chat_id_customer_service', '', 'string', 'api', '客服 Telegram 群組 Chat ID', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
