#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
db_container="${EFAN_TARGET_DB_CONTAINER:-${EFAN_DEV_DB_CONTAINER:-efan-work-db}}"
db_user="${EFAN_TARGET_DB_USER:-${EFAN_DEV_DB_USER:-efan_work}}"
db_name="${EFAN_TARGET_DB_NAME:-${EFAN_DEV_DB_NAME:-efan_working_copy}}"

docker exec -i "$db_container" psql -U "$db_user" -d "$db_name" \
  -f /dev/stdin < "${repo_root}/scripts/check-content-release-sync-dependencies.sql"
