# Execution Backlog

## Priority 1

- document the current `dev` runtime as the new baseline
- implement canonical product upload paths and block new flat product asset paths
- add an uploads mount and critical asset health gate before public dev traffic is considered healthy
- wire `scripts/check-dev-uploads-mount.sh` into the standard post-deploy smoke flow
- finish conservative script cleanup in `app-legacy-base/scripts`
- write settings/env/secrets governance rules
- write DB backup/restore/sync-down runbook

## Priority 2

- prepare `pre.efan.tw` deployment blueprint for Mac mini
- define `pre` uploads path, DB path, tunnel path, and compose layout
- define release smoke-check list for website, products, quotes, customers, AI, and Telegram

## Priority 3

- expand uploads integrity audit to report missing references, unreferenced files, canonical path violations, and quarantine candidates
- add release history log
- add rollback checklist
- reduce duplicate seed/fix/import scripts

## Guardrails

- do not remove user-facing features unless explicitly requested
- do not let `dev` overwrite production data
- do not treat old assets as source of truth without review
- prefer repeatable scripts and documents over manual memory
