#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  export-customer-quote-domain.sh \
    --source-db-container <name> \
    --source-db-user <user> \
    --source-db-name <db> \
    [--backup-root <dir>] \
    [--env-name <name>] \
    [--table-list <path>]

Exports the primary customer/quote sync domain as a gzipped SQL artifact that can
be transferred from `www` to `dev` and later applied selectively.
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

SOURCE_DB_CONTAINER=""
SOURCE_DB_USER=""
SOURCE_DB_NAME=""
BACKUP_ROOT=""
ENV_NAME="www"
TABLE_LIST=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-db-container)
      SOURCE_DB_CONTAINER="$2"
      shift 2
      ;;
    --source-db-user)
      SOURCE_DB_USER="$2"
      shift 2
      ;;
    --source-db-name)
      SOURCE_DB_NAME="$2"
      shift 2
      ;;
    --backup-root)
      BACKUP_ROOT="$2"
      shift 2
      ;;
    --env-name)
      ENV_NAME="$2"
      shift 2
      ;;
    --table-list)
      TABLE_LIST="$2"
      shift 2
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

if [[ -z "$SOURCE_DB_CONTAINER" || -z "$SOURCE_DB_USER" || -z "$SOURCE_DB_NAME" ]]; then
  usage >&2
  exit 1
fi

require_cmd docker
require_cmd gzip
require_cmd date

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
table_list="${TABLE_LIST:-${repo_root}/scripts/customer-quote-sync-primary-tables.txt}"
backup_root="${BACKUP_ROOT:-${EFAN_BACKUP_ROOT:-/home/cliv/projects/backup-efan.tw}}"
backup_root="$(realpath -m "$backup_root")"

if [[ ! -f "$table_list" ]]; then
  echo "Table list file not found: $table_list" >&2
  exit 1
fi

mapfile -t tables < <(grep -v '^\s*$' "$table_list")
if [[ "${#tables[@]}" -eq 0 ]]; then
  echo "No tables found in: $table_list" >&2
  exit 1
fi

timestamp="$(date '+%Y%m%d-%H%M%S')"
export_dir="${backup_root}/${timestamp}-${ENV_NAME}-customer-quote-sync"
mkdir -p "${export_dir}"
artifact_name="customer-quote-sync-${ENV_NAME}-${timestamp}.sql.gz"

pg_dump_args=(
  pg_dump
  -U "$SOURCE_DB_USER"
  -d "$SOURCE_DB_NAME"
  --data-only
  --column-inserts
  --disable-triggers
)

for table_name in "${tables[@]}"; do
  pg_dump_args+=(--table="$table_name")
done

echo "Exporting customer/quote domain from ${SOURCE_DB_CONTAINER}..."
docker exec "$SOURCE_DB_CONTAINER" "${pg_dump_args[@]}" | gzip > "${export_dir}/${artifact_name}"

{
  echo "created_at=$(date --iso-8601=seconds)"
  echo "source_env=${ENV_NAME}"
  echo "source_db_container=${SOURCE_DB_CONTAINER}"
  echo "source_db_name=${SOURCE_DB_NAME}"
  echo "table_list=$(basename "$table_list")"
  echo "artifact=${artifact_name}"
  echo "tables="
  printf '%s\n' "${tables[@]}"
} > "${export_dir}/manifest.txt"

cp "$table_list" "${export_dir}/$(basename "$table_list")"

(
  cd "$export_dir"
  sha256sum "$artifact_name" manifest.txt "$(basename "$table_list")" > sha256.txt
)

echo "Selective sync export created at: ${export_dir}/${artifact_name}"
echo "Manifest: ${export_dir}/manifest.txt"
