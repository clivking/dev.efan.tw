# dev.efan.tw

Clean rebuild workspace for the efan development environment.

## Stack

- Next.js
- TypeScript
- pnpm
- PostgreSQL
- Docker Compose
- Cloudflare Tunnel

## Structure

- `app/` application source
- `infra/` local and deployment infrastructure files
- `docs/` rebuild notes and runbooks
- `import-review/` isolated area for backup review
- `scripts/` repeatable helper scripts

## Legacy Rule

- anything from the old system must carry the suffix `-old`
- old data goes into `import-review/db-old/`
- old code goes into `import-review/code-old/`
- old temporary database work uses [compose.old-db.yaml](/home/cliv/projects/dev.efan.tw/compose.old-db.yaml)

## Local Commands

Inside `app/`:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

With Docker:

```bash
docker compose up --build
```

This starts:

- `web` on local port `5000`
- `db` on local port `5432`
- `cloudflared` for `https://dev.efan.tw`

## Working Rules

- code moves from `dev` to `pre` to `www`
- production data moves from `www` down to `pre` and `dev`
- do not copy whole environments upward
- review old backups before importing them into the app
