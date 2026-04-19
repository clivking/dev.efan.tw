#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  apply-customer-quote-domain.sh \
    --artifact <path/to/customer-quote-sync.sql.gz> \
    --target-db-container <name> \
    --target-db-user <user> \
    --target-db-name <db> \
    [--table-list <path>] \
    [--skip-dependency-check]

Applies a previously exported customer/quote domain artifact to the target DB
after truncating only the selective-sync tables.
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

ARTIFACT=""
TARGET_DB_CONTAINER=""
TARGET_DB_USER=""
TARGET_DB_NAME=""
TABLE_LIST=""
SKIP_DEPENDENCY_CHECK="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --artifact)
      ARTIFACT="$2"
      shift 2
      ;;
    --target-db-container)
      TARGET_DB_CONTAINER="$2"
      shift 2
      ;;
    --target-db-user)
      TARGET_DB_USER="$2"
      shift 2
      ;;
    --target-db-name)
      TARGET_DB_NAME="$2"
      shift 2
      ;;
    --table-list)
      TABLE_LIST="$2"
      shift 2
      ;;
    --skip-dependency-check)
      SKIP_DEPENDENCY_CHECK="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ARTIFACT" || -z "$TARGET_DB_CONTAINER" || -z "$TARGET_DB_USER" || -z "$TARGET_DB_NAME" ]]; then
  usage >&2
  exit 1
fi

require_cmd docker
require_cmd gzip
require_cmd mktemp

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
table_list="${TABLE_LIST:-${repo_root}/scripts/customer-quote-sync-primary-tables.txt}"
artifact="$(realpath "$ARTIFACT")"

if [[ ! -f "$artifact" ]]; then
  echo "Artifact not found: $artifact" >&2
  exit 1
fi

if [[ ! -f "$table_list" ]]; then
  echo "Table list file not found: $table_list" >&2
  exit 1
fi

if [[ "$SKIP_DEPENDENCY_CHECK" != "true" ]]; then
  "${repo_root}/scripts/check-customer-quote-sync-dependencies.sh"
fi

mapfile -t tables < <(grep -v '^\s*$' "$table_list")
if [[ "${#tables[@]}" -eq 0 ]]; then
  echo "No tables found in: $table_list" >&2
  exit 1
fi

truncate_sql_file="$(mktemp)"
trap 'rm -f "$truncate_sql_file"' EXIT

{
  echo "BEGIN;"
  echo "SET session_replication_role = replica;"
  echo "TRUNCATE TABLE"
  for ((i=${#tables[@]}-1; i>=0; i--)); do
    suffix=","
    if [[ "$i" -eq 0 ]]; then
      suffix=""
    fi
    printf '  %s%s\n' "${tables[$i]}" "$suffix"
  done
  echo "CASCADE;"
  echo "SET session_replication_role = DEFAULT;"
  echo "COMMIT;"
} > "$truncate_sql_file"

echo "Truncating selective-sync tables in ${TARGET_DB_CONTAINER}..."
docker exec -i "$TARGET_DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" \
  -f /dev/stdin < "$truncate_sql_file"

echo "Applying selective-sync artifact ${artifact}..."
gzip -dc "$artifact" | docker exec -i "$TARGET_DB_CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME"

echo "Re-running dependency checks after apply..."
EFAN_DEV_DB_CONTAINER="$TARGET_DB_CONTAINER" \
EFAN_DEV_DB_USER="$TARGET_DB_USER" \
EFAN_DEV_DB_NAME="$TARGET_DB_NAME" \
  "${repo_root}/scripts/check-customer-quote-sync-dependencies.sh"

echo "Selective sync apply completed."
