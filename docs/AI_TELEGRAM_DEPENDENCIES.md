# AI And Telegram Dependencies

## Goal

Record the actual runtime dependencies for the working copy so AI chat and Telegram notifications can be carried forward cleanly across:

- local working copy
- `dev.efan.tw`
- future `pre.efan.tw`
- future `www.efan.tw`

## Current Runtime Split

### `.env.compose-work`

Current working copy env file:

- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `JWT_SECRET`
- `PORTAL_JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NODE_ENV`
- `PUBLIC_ROOT`
- `UPLOADS_ROOT`
- `EFAN_SKIP_TURNSTILE`

These values provide local runtime basics, but they do not contain the actual AI or Telegram credentials.

### Database settings

AI, Turnstile, and Telegram are primarily configured through the `settings` table.

## AI Dependencies

### Core setting keys

- `ai_provider`
- `ai_max_tokens`
- `ai_temperature`
- `ai_openai_api_key`
- `ai_openai_model`
- `ai_gemini_api_key`
- `ai_gemini_model`
- `ai_api_key`
- `ai_model`

### Main runtime files

- `app-legacy-base/src/lib/ai/ai-engine.ts`
- `app-legacy-base/src/lib/ai/providers/openai.ts`
- `app-legacy-base/src/lib/ai/providers/gemini.ts`
- `app-legacy-base/src/app/api/ai/test-connection/route.ts`
- `app-legacy-base/src/app/api/ai/models/route.ts`
- `app-legacy-base/src/app/api/ai/usage/route.ts`
- `app-legacy-base/src/app/api/public/chat/*`
- `app-legacy-base/src/components/chat/*`

### Notes

- AI provider selection is dynamic and read from the database.
- The code supports both OpenAI and Gemini.
- Admin-side connection testing exists and should be preserved.
- AI usage is tracked in the database, so this is not just a front-end widget.

## Telegram Dependencies

### Core setting keys

- `telegram_bot_token`
- `telegram_chat_id`
- `telegram_chat_id_customer_service`
- `telegram_webhook_secret`

### Main runtime files

- `app-legacy-base/src/lib/notifications/telegram.ts`
- `app-legacy-base/src/app/api/telegram/webhook/route.ts`
- `app-legacy-base/src/app/api/telegram/setup-webhook/route.ts`
- `app-legacy-base/src/app/api/notifications/route.ts`
- `app-legacy-base/src/app/api/notifications/test-bot-token/route.ts`
- `app-legacy-base/src/app/api/notifications/test-telegram/route.ts`
- `app-legacy-base/src/app/api/public/chat/*`
- `app-legacy-base/src/app/api/public/inquiry/route.ts`
- `app-legacy-base/src/app/api/public/quote-request/route.ts`
- `app-legacy-base/src/app/api/public/q/[token]/*`

### Notes

- Telegram send logic reads token and chat id from database settings, not from `.env.compose-work`.
- Webhook setup writes `telegram_webhook_secret` back into the settings table if missing.
- Telegram is tied to quote, inquiry, signature, and chat workflows.

## Turnstile Dependencies

### Core setting keys

- `turnstile_enabled`
- `turnstile_site_key`
- `turnstile_secret_key`

### Env toggle

- `EFAN_SKIP_TURNSTILE=true`

### Main runtime files

- `app-legacy-base/src/lib/turnstile.ts`
- `app-legacy-base/src/app/api/public/site-config/route.ts`
- `app-legacy-base/src/app/api/public/chat/*`
- `app-legacy-base/src/app/api/public/inquiry/route.ts`
- `app-legacy-base/src/app/api/public/quote-request/route.ts`
- `app-legacy-base/src/app/api/contact/route.ts`

### Notes

- Local working copy currently skips Turnstile by env.
- Production-like environments should use real Turnstile keys from the settings table.

## Carry-Forward Rule

When rebuilding environment setup, treat these as first-class runtime dependencies:

- AI settings
- Telegram settings
- Turnstile settings

Do not classify them as optional cleanup targets.

## Current Working Copy Database Status

The working copy database currently contains these settings and they are present, not missing:

### AI

- `ai_provider = gemini`
- `ai_gemini_model = gemini-3-flash-preview`
- `ai_gemini_api_key = present (encrypted)`
- `ai_api_key = present (encrypted)`
- `ai_openai_model = gpt-4o`
- `ai_openai_api_key = empty`
- `ai_max_tokens = 2000`
- `ai_temperature = 0.7`
- `ai_chat_enabled = true`
- `ai_chat_max_history = 20`
- `ai_monthly_budget = 10`

### Telegram

- `telegram_bot_token = present (encrypted)`
- `telegram_chat_id = present`
- `telegram_chat_id_customer_service = present`
- `telegram_webhook_secret = present`

### Turnstile

- `turnstile_enabled = true`
- `turnstile_site_key = present`
- `turnstile_secret_key = present (encrypted)`

### Conclusion

At this stage, the issue is not missing settings data.

The main operational task later is:

- carrying these settings safely across environments
- preserving encryption compatibility
- deciding which values stay in database settings and which belong in environment files

## Encryption Compatibility

Encrypted settings are decrypted through:

- `app-legacy-base/src/lib/settings.ts`
- `app-legacy-base/src/lib/encryption.ts`

The current encrypted setting keys include:

- `ai_api_key`
- `ai_gemini_api_key`
- `ai_openai_api_key`
- `smtp_pass`
- `telegram_bot_token`
- `turnstile_secret_key`

### Rule

If the database is copied to another environment, that environment must use a compatible `ENCRYPTION_KEY`.

Otherwise:

- encrypted settings still exist in the database
- but the app will fail to decrypt them correctly
- which will break AI, Telegram, SMTP, and Turnstile secret reads

### Carry-Forward Requirement

When moving from `dev` to `pre` or `www`, treat this as a linked set:

- database snapshot
- `ENCRYPTION_KEY`

They must stay compatible.
