#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  EFAN_WWW_REPO_PATH=/path/to/repo \
  EFAN_WWW_DB_CONTAINER=efan-www-db \
  EFAN_WWW_DB_USER=<user> \
  EFAN_WWW_DB_NAME=<db> \
  EFAN_WWW_UPLOADS_PATH=/path/to/uploads \
  EFAN_WWW_COMPOSE_FILE=/path/to/compose.yml \
  EFAN_WWW_ENV_FILE=/path/to/.env \
  EFAN_WWW_EXTRA_PATHS="/path/one:/path/two" \
  ./scripts/backup-www-portable.sh

Required:
  EFAN_WWW_REPO_PATH
  EFAN_WWW_DB_CONTAINER
  EFAN_WWW_DB_USER
  EFAN_WWW_DB_NAME
  EFAN_WWW_UPLOADS_PATH

Optional:
  EFAN_WWW_BACKUP_ROOT
  EFAN_WWW_COMPOSE_FILE
  EFAN_WWW_ENV_FILE
  EFAN_WWW_EXTRA_PATHS
EOF
}

required_vars=(
  EFAN_WWW_REPO_PATH
  EFAN_WWW_DB_CONTAINER
  EFAN_WWW_DB_USER
  EFAN_WWW_DB_NAME
  EFAN_WWW_UPLOADS_PATH
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: ${var_name}" >&2
    usage >&2
    exit 1
  fi
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_root="${EFAN_WWW_BACKUP_ROOT:-${EFAN_BACKUP_ROOT:-/home/cliv/projects/backup-efan.tw}}"

cmd=(
  "${repo_root}/scripts/create-portable-backup.sh"
  --env-name www
  --backup-root "${backup_root}"
  --repo-path "${EFAN_WWW_REPO_PATH}"
  --db-container "${EFAN_WWW_DB_CONTAINER}"
  --db-user "${EFAN_WWW_DB_USER}"
  --db-name "${EFAN_WWW_DB_NAME}"
  --uploads-path "${EFAN_WWW_UPLOADS_PATH}"
)

if [[ -n "${EFAN_WWW_COMPOSE_FILE:-}" ]]; then
  cmd+=(--compose-file "${EFAN_WWW_COMPOSE_FILE}")
fi

if [[ -n "${EFAN_WWW_ENV_FILE:-}" ]]; then
  cmd+=(--env-file "${EFAN_WWW_ENV_FILE}")
fi

if [[ -n "${EFAN_WWW_EXTRA_PATHS:-}" ]]; then
  IFS=':' read -r -a extra_paths <<< "${EFAN_WWW_EXTRA_PATHS}"
  for extra_path in "${extra_paths[@]}"; do
    [[ -n "${extra_path}" ]] || continue
    cmd+=(--extra-path "${extra_path}")
  done
fi

"${cmd[@]}"
