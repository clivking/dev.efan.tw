# Long-Term Master Plan

## Current State

- `dev.efan.tw` is live and backed by the recovered working copy in `app-legacy-base`
- runtime is containerized with Docker and exposed through Cloudflare Tunnel
- product, customer, quote, AI chat, Telegram, and admin flows are being preserved
- the project is stable enough to operate, but still contains legacy structural debt

## Long-Term Target

Build a durable three-environment system:

- `dev.efan.tw` for daily development and controlled data refreshes
- `pre.efan.tw` for release validation on Mac mini
- `www.efan.tw` for production

Core principles:

- code flows upward: `dev -> pre -> www`
- data flows downward: `www -> pre/dev`
- deployments move versions, not whole machines
- legacy materials remain reference-only unless deliberately promoted

## Main Risks To Eliminate

1. mixed configuration across DB settings, env files, and machine state
2. uploads/assets that are usable but not yet governed like first-class data
3. legacy scripts and one-off tooling that can confuse future maintenance
4. incomplete release discipline between `dev`, `pre`, and `www`
5. insufficient backup, restore, and rollback documentation

## Execution Phases

### Phase 1: Stabilize Dev

- keep `dev.efan.tw` healthy and reproducible
- continue pruning obsolete scripts and deployment leftovers
- document current runtime, ports, data paths, and secrets boundaries
- keep working copy behavior unchanged while reducing confusion

### Phase 2: Configuration Governance

- define which settings belong in DB
- define which values belong in env files
- define which values are secrets only
- document encryption-key handling across `dev`, `pre`, and `www`

### Phase 3: Data And Asset Governance

- formalize PostgreSQL backup and restore
- formalize production-to-dev/pre data refresh
- formalize `public/uploads` inventory, backup, verification, and restore
- add repeatable integrity checks for missing images and broken references

### Phase 4: Pre Environment

- reproduce the same image-based runtime on Mac mini
- bring up `pre.efan.tw` with separate DB and uploads
- validate all preserved modules: website, products, customers, quotes, AI, Telegram, admin
- make `pre` the mandatory release gate before `www`

### Phase 5: Release Discipline

- deploy explicit Git commits only
- record release version, date, and rollback target
- standardize smoke checks after each deploy
- standardize production rollback procedure

### Phase 6: Progressive Refactor

- keep all current business features
- improve modules gradually instead of rewriting blindly
- replace legacy structure slice by slice only when a cleaner design is proven

## Success Standard

The system reaches long-term health when:

- `dev`, `pre`, and `www` share the same deployment pattern
- all secrets and settings have one clear source of truth
- DB restore and uploads restore are documented and tested
- releases are traceable to a commit and reversible
- no one needs historical machine knowledge to keep the system alive
