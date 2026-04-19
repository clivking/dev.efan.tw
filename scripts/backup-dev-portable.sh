#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_root="${EFAN_BACKUP_ROOT:-/home/cliv/projects/backup-efan.tw}"

"${repo_root}/scripts/create-portable-backup.sh" \
  --env-name dev \
  --backup-root "${backup_root}" \
  --repo-path "${repo_root}" \
  --db-container efan-work-db \
  --db-user efan_work \
  --db-name efan_working_copy \
  --uploads-path "${repo_root}/app-legacy-base/public/uploads" \
  --compose-file "${repo_root}/compose.work-prod.yaml" \
  --env-file "${repo_root}/app-legacy-base/.env.compose-prod" \
  --extra-path "${repo_root}/infra/cloudflared/work-config.yml"
