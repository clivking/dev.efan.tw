# Settings, Env, And Secrets Policy

## Goal

Define one clear home for each kind of configuration so that `dev`, `pre`, and `www` stay predictable.

## Category 1: Database Settings

Use DB `settings` for values that are part of site behavior and may be managed from admin.

Examples:

- company profile and website display settings
- AI provider selection and AI behavior settings
- Telegram behavior settings
- Turnstile feature enablement
- quote defaults and business-rule settings

Rule:

- if the admin UI is expected to edit it, it belongs in DB settings

## Category 2: Environment Variables

Use env files for deployment-specific runtime values.

Examples:

- `DATABASE_URL`
- `NODE_ENV`
- app port
- internal hostnames
- tunnel/runtime wiring
- feature flags used only for local or environment-level behavior

Rule:

- if a value changes by machine or deployment target, it belongs in env

## Category 3: Secrets

Use secrets for sensitive values that must never become casual project content.

Examples:

- `ENCRYPTION_KEY`
- JWT/auth secrets
- DB passwords
- SMTP credentials when not managed in encrypted DB settings
- any recovery-only keys

Rule:

- secrets must be documented as required, but raw secret values must not be committed

## Critical Rule: Encryption Compatibility

Some DB settings are encrypted at rest.

That means:

- `dev`, `pre`, and `www` must use compatible `ENCRYPTION_KEY` handling
- if production DB content is synced down to `pre` or `dev`, the receiving environment must be able to decrypt those values
- changing encryption handling without a migration plan will silently break AI, Telegram, and other integrations

## Operational Rules

1. do not move admin-editable settings into env just because they are inconvenient
2. do not commit env files containing real secrets
3. do not assume DB-exported encrypted values are usable in another environment without key compatibility
4. document every required secret by name and purpose

## Immediate Follow-Up

- create an environment matrix for `dev`, `pre`, and `www`
- list required secrets for runtime startup and encrypted setting access
- define DB sync-down procedure with encryption compatibility check
