# Secrets Inventory

## Goal

Record every secret that must be present for safe operation without storing the raw values in Git.

## Runtime Secrets

### Required For Startup

- `DATABASE_URL`
  - purpose: app-to-DB connection
  - scope: `dev`, `pre`, `www`
  - note: should reference each environment's own database

- `ENCRYPTION_KEY`
  - purpose: decrypt encrypted settings stored in DB
  - scope: `dev`, `pre`, `www`
  - note: must be compatible with the DB snapshot loaded into that environment

- `JWT_SECRET`
  - purpose: admin/session auth token signing
  - scope: `dev`, `pre`, `www`

- `PORTAL_JWT_SECRET`
  - purpose: customer portal token signing
  - scope: `dev`, `pre`, `www`

## Tunnel / Infrastructure Secrets

- Cloudflare tunnel credentials JSON
  - purpose: authenticate tunnel connector
  - current dev location: Windows user Cloudflare config path used by Docker bind mount
  - future scope: separate credential material for `dev`, `pre`, and `www` as needed

## Database-Stored Encrypted Secrets

These currently live in the `settings` table and depend on `ENCRYPTION_KEY`:

- `ai_api_key`
- `ai_gemini_api_key`
- `ai_openai_api_key`
- `smtp_pass`
- `telegram_bot_token`
- `turnstile_secret_key`

## Database-Stored Non-Encrypted Sensitive Values

- `telegram_chat_id`
- `telegram_chat_id_customer_service`
- `telegram_webhook_secret`
- `turnstile_site_key`

These may not all be encrypted, but they still need operational care and should not be spread casually across machines or notes.

## Non-Secret But Environment-Critical Values

These are not raw secrets, but they must still be tracked deliberately:

- `NEXT_PUBLIC_APP_URL`
- `PUBLIC_ROOT`
- `UPLOADS_ROOT`
- `NODE_ENV`

## Handling Rules

1. never commit raw secret values
2. never assume DB-exported encrypted values are usable without the matching `ENCRYPTION_KEY`
3. use distinct auth secrets for `dev`, `pre`, and `www` unless there is a strong migration reason not to
4. document presence, owner, and rotation method even if the value itself stays outside Git

## Next Follow-Up

- map where each secret is stored today
- define how Mac mini `pre` and `www` will receive them
- define recovery procedure if one environment loses a secret but retains the DB snapshot
