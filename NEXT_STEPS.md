# Next Steps

## Current State

- `dev.efan.tw` is live from the recovered working copy
- runtime is image-based and exposed through Cloudflare Tunnel
- core business features are preserved
- the current focus is long-term cleanup, governance, and deployment discipline

## Current Recommended Sequence

1. finish conservative cleanup of legacy scripts and duplicated tooling
2. document settings, env, and secret boundaries
3. document DB backup, restore, and production-to-dev/pre sync-down
4. prepare `pre.efan.tw` deployment blueprint for Mac mini
5. standardize release verification for `dev -> pre -> www`

## Reference Docs

- `docs/LONG_TERM_MASTERPLAN.md`
- `docs/EXECUTION_BACKLOG.md`
- `docs/SETTINGS_ENV_SECRETS_POLICY.md`
- `docs/ENVIRONMENT_MATRIX.md`
- `docs/SECRETS_INVENTORY.md`
- `docs/DB_BACKUP_RESTORE_SYNC.md`
- `docs/WORKING_COPY_STATUS.md`
- `docs/UPLOADS_GOVERNANCE.md`
- `docs/SCRIPTS_GOVERNANCE.md`
- `docs/WORKING_COPY_CLEANUP.md`
- `docs/AI_TELEGRAM_DEPENDENCIES.md`
- `docs/README.md`

## Archived Reference

- `docs/archive/operational-review/`
- `docs/archive/audits/UPLOADS_AUDIT_2026-04-13.md`
- `docs/archive/bootstrap-notes/`

## Rule Of Thumb

- preserve existing business functionality
- improve structure gradually
- prefer documented, repeatable operations over memory-driven operations
