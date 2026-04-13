# dev.efan.tw

Recovered and stabilized workspace for the efan development environment.

## Stack

- Next.js
- TypeScript
- npm in `app-legacy-base`
- PostgreSQL
- Docker Compose
- Cloudflare Tunnel

## Structure

- `app/` early clean-baseline rebuild app kept as reference, not the live runtime
- `app-legacy-base/` recovered working copy that currently powers `dev.efan.tw`
- `infra/` local and deployment infrastructure files
- `docs/` operating notes, cleanup notes, and long-term planning
- `import-review/` isolated area for backup review
- `scripts/` root-level old-db review helpers and workspace support notes

## Legacy Rule

- anything from the old system must carry the suffix `-old`
- old data goes into `import-review/db-old/`
- old code goes into `import-review/code-old/`
- old database snapshots stay in `import-review/db-old/` and are mounted only when explicitly needed

## Runtime

Current active dev runtime:

- website on local port `5000`
- PostgreSQL on local port `5433` for the recovered working copy DB
- Cloudflare Tunnel exposes `https://dev.efan.tw`

## Local Commands

Inside `app-legacy-base/`:

```bash
npm run dev
npm run lint
npm run build
```

With Docker:

```bash
docker compose -f compose.work-prod.yaml up --build -d
```

## Working Rules

- code moves from `dev` to `pre` to `www`
- production data moves from `www` down to `pre` and `dev`
- do not copy whole environments upward
- review old backups before importing them into the app

## Planning Docs

- `docs/LONG_TERM_MASTERPLAN.md`
- `docs/EXECUTION_BACKLOG.md`
- `docs/SETTINGS_ENV_SECRETS_POLICY.md`
- `docs/WORKING_COPY_CLEANUP.md`
- `docs/README.md`

Archived bootstrap notes:

- `docs/archive/bootstrap-notes/`
