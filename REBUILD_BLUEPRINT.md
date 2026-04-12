# dev.efan.tw Rebuild Blueprint

## Goal

Rebuild the project from a clean base so that:

- `dev.efan.tw` is the main development environment on the local `Win11 + WSL2 + Ubuntu` machine.
- `pre.efan.tw` is the staging environment on the Mac mini.
- `www.efan.tw` is the production environment on the Mac mini.
- code promotion and database synchronization are treated as different workflows.
- old backups are reviewed before import so past problems do not come back.

## Core Principles

1. Code moves upward: `dev -> pre -> www`
2. Production data moves downward: `www -> pre/dev`
3. Production is never overwritten by development data.
4. Every deployment must point to a specific Git commit.
5. Old files are imported only after review.
6. Skills will be rebuilt from scratch after the project baseline is stable.

## Recommended Architecture

### Local Development Machine

Machine:

- Intel i9
- Windows 11
- WSL2
- Ubuntu

Recommended tools:

- `Docker Desktop`
- `cloudflared`
- `git`
- the project lives inside WSL filesystem, not inside a Windows folder

Reasoning:

- `Docker Desktop` with WSL2 is the simplest way to run Linux containers locally.
- `cloudflared` can expose local development safely to `dev.efan.tw` when needed.
- keeping the repo inside WSL reduces path and permission issues.

### Server Machine

Machine:

- Mac mini M4
- OrbStack

Recommended services:

- `cloudflared`
- `caddy`
- app containers
- one database per environment

Suggested environment split:

- `pre` runs its own app container and its own database
- `www` runs its own app container and its own database
- `pre` and `www` must not share the same database

## Domain and Traffic Layout

- `dev.efan.tw` -> Cloudflare Tunnel -> local dev service on WSL2
- `pre.efan.tw` -> Cloudflare Tunnel -> Mac mini staging service
- `www.efan.tw` -> Cloudflare Tunnel -> Mac mini production service

On the Mac mini:

- `cloudflared` receives traffic from Cloudflare
- `caddy` routes requests to the correct local service
- each environment has its own app and database

## Deployment Model

### Old Model

The old process moved a whole environment upward, including data.

Risk:

- test data can leak into production
- production data can be accidentally replaced
- it is hard to know exactly what code version is running

### New Model

Use Git and containerized releases.

Flow:

1. develop on `dev`
2. commit changes to Git
3. deploy the same commit to `pre`
4. validate on `pre`
5. deploy the same commit to `www`

Important:

- `pre` is a rehearsal environment
- `www` should receive the same app version that already passed on `pre`
- deployments should move code and migrations, not a full copied environment

## Database Rules

### Production Database

`www` is the source of truth for:

- customers
- quotations
- other live operational data

### Development Database

`dev` should receive a copied dataset from production when needed.

Rules:

- import from `www` to `dev`
- sanitize sensitive data if necessary
- never push `dev` data back to `www`

### Staging Database

`pre` should also receive a copy from production when realistic testing is needed.

Rules:

- import from `www` to `pre`
- use this to confirm schema changes and business flows
- never treat `pre` as the source of truth

## Cross-Architecture Notes

Current hardware:

- local machine: `amd64`
- Mac mini M4: `arm64`

This matters only when the app or its dependencies contain architecture-specific binaries.

Recommended approach:

- run the app in Docker containers
- prefer multi-platform compatible base images
- if needed, build images for both `linux/amd64` and `linux/arm64`

Conclusion:

- WSL2 does not remove architecture differences by itself
- containerization reduces the pain a lot
- we still need to verify native dependencies

## Recommended Repo Shape

This repo should be rebuilt with a clean top-level structure.

Suggested layout:

```text
/
  app/                 main application
  infra/               docker, caddy, cloudflared, deploy config
  docs/                rebuild notes, import decisions, runbooks
  import-review/       isolated review area for old backups
  scripts/             repeatable helper scripts
  .gitignore
  README.md
```

Notes:

- old backup material should go into `import-review/`
- do not mix imported legacy files directly into `app/`

## What To Rebuild First

Phase 1:

- choose app framework and package manager
- set up Git baseline
- create the clean project skeleton
- create Docker-based local development

Phase 2:

- define `pre` and `www` runtime layout on the Mac mini
- add Caddy and Cloudflare Tunnel configuration
- define deployment commands

Phase 3:

- design database dump and restore workflow
- document which data can sync down to `dev` and `pre`
- test migrations using a copied staging dataset

Phase 4:

- review old backups in small batches
- import only approved assets, logic, and content
- reject outdated config, caches, and dead code

Phase 5:

- rebuild skills from scratch
- document the new workflow

## Immediate Next Decisions

Before implementation, we should lock these choices:

1. application framework
2. package manager
3. database engine
4. whether authentication/admin will live inside the same app
5. whether we will deploy by Git pull, Docker image, or both

## Strong Recommendation

Do not continue with the old "clone full environment upward" method.

The safer replacement is:

- Git for code history
- containers for runtime consistency
- one database per environment
- controlled data copy from `www` down to `pre` and `dev`

## First Build Target

The first practical milestone should be:

"Create a clean local application skeleton on `dev.efan.tw` with Docker-based development and a documented path to later deploy the same codebase to `pre` and `www`."
