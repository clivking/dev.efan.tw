# Scripts

Repeatable helper scripts live here.

Current release-flow helpers:

- `backup-dev-portable.sh`: create a portable `dev` backup package under `/home/cliv/projects/backup-efan.tw`
- `backup-www-portable.sh`: create a portable `www` backup package under `/home/cliv/projects/backup-efan.tw` or an explicit override
- `export-customer-quote-domain.sh`: export the selective customer/quote domain from `www` or another source DB
- `apply-customer-quote-domain.sh`: apply a selective customer/quote domain artifact onto the target DB
- `run-customer-quote-sync.sh`: one-command wrapper for Step 3 backup, apply, and smoke-check flow
- `run-release-smoke-checks.sh`: lightweight HTTP smoke checks for `dev`, `pre`, or `www`
- `check-dev-uploads-mount.sh`: verify `efan-dev-web` did not start with an empty `tmpfs` at `/app/public/uploads`
- `deploy-release.sh`: generic remote source deploy with remote rebuild, optional separate runtime path, and release manifest
- `deploy-to-pre.sh`: wrapper for the `dev -> pre` release promotion
- `deploy-to-www.sh`: wrapper for the `pre/dev -> www` release promotion
- `create-portable-backup.sh`: shared portable-backup implementation
- `check-customer-quote-sync-dependencies.sh`: validate quote-domain dependency integrity before or after selective sync
- `check-customer-quote-sync-dependencies.sql`: SQL checks used by the dependency validator
- `customer-quote-sync-primary-tables.txt`: canonical primary table scope for Step 3 selective sync

## Current Deployment Caveats

These helpers describe the intended long-term direction, but the current Mac mini runtime still has environment-specific behavior that operators must respect.

- current `pre` is split between a remote build-context tree and a separate runtime compose directory
- current `www` relies on the remote runtime file `/Users/cliv/efan_server/nextjs/docker-compose.yml`
- do not assume the repo-level `compose.yaml` in the remote `www` source tree is the production release entrypoint
- do not let a source sync delete the remote `docker-compose.yml` for `www`
- exclude scratch paths such as `temp_web` when syncing the current `www` source tree
- verify the actual compose service names from the remote runtime compose file before restarting `pre` or `www`
- if Step 3 was executed in the same run, create a new `dev` backup after Step 3 and use that post-Step-3 backup for any Step 4 `pre` DB or uploads refresh

## Uploads mount check

Use this after rebuilding `efan-dev-web` when image or product assets unexpectedly
disappear from `dev.efan.tw`.

```bash
./scripts/check-dev-uploads-mount.sh
./scripts/check-dev-uploads-mount.sh products/AR-837-E/images/AR-837-E_01_front.png
```

The script fails if:

- `/app/public/uploads` is missing inside the container
- `/app/public/uploads` resolves to `tmpfs`
- the target upload file is not visible inside the container
- `http://localhost:5000/api/uploads/...` does not return `200 OK`
