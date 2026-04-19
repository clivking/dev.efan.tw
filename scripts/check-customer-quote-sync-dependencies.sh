#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
db_container="${EFAN_DEV_DB_CONTAINER:-efan-work-db}"
db_user="${EFAN_DEV_DB_USER:-efan_work}"
db_name="${EFAN_DEV_DB_NAME:-efan_working_copy}"

docker exec -i "$db_container" psql -U "$db_user" -d "$db_name" \
  -f /dev/stdin < "${repo_root}/scripts/check-customer-quote-sync-dependencies.sql"
