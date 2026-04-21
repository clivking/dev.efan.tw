#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  apply-content-release-domain.sh \
    --artifact <path/to/content-release-sync.sql.gz> \
    --target-db-container <name> \
    --target-db-user <user> \
    --target-db-name <db> \
    [--table-list <path>] \
    [--skip-content-check] \
    [--skip-quote-check]

Applies a release-owned content artifact to the target DB after truncating only
the selected content tables. Intended for Step 5 content promotion into `www`
while preserving the live customer/quote domain.
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
SKIP_CONTENT_CHECK="false"
SKIP_QUOTE_CHECK="false"

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
    --skip-content-check)
      SKIP_CONTENT_CHECK="true"
      shift
      ;;
    --skip-quote-check)
      SKIP_QUOTE_CHECK="true"
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
table_list="${TABLE_LIST:-${repo_root}/scripts/content-release-primary-tables.txt}"
artifact="$(realpath "$ARTIFACT")"

if [[ ! -f "$artifact" ]]; then
  echo "Artifact not found: $artifact" >&2
  exit 1
fi

if [[ ! -f "$table_list" ]]; then
  echo "Table list file not found: $table_list" >&2
  exit 1
fi

mapfile -t tables < <(grep -v '^\s*$' "$table_list")
if [[ "${#tables[@]}" -eq 0 ]]; then
  echo "No tables found in: $table_list" >&2
  exit 1
fi

truncate_sql_file="$(mktemp)"
cascade_check_sql_file="$(mktemp)"
trap 'rm -f "$truncate_sql_file" "$cascade_check_sql_file"' EXIT

protected_tables=(
  customers
  company_names
  contacts
  locations
  quotes
  quote_variants
  quote_items
  quote_contacts
  quote_tokens
  quote_views
  quote_signatures
  payments
)

{
  echo "WITH RECURSIVE target(relid) AS ("
  for ((i=0; i<${#tables[@]}; i++)); do
    prefix="  SELECT"
    if [[ "$i" -gt 0 ]]; then
      prefix="  UNION SELECT"
    fi
    printf "%s %s::regclass\n" "$prefix" "'${tables[$i]}'"
  done
  echo "), cascade_targets(relid, path) AS ("
  echo "  SELECT relid, ARRAY[relid] FROM target"
  echo "  UNION"
  echo "  SELECT c.conrelid, ct.path || c.conrelid"
  echo "  FROM pg_constraint c"
  echo "  JOIN cascade_targets ct ON c.confrelid = ct.relid"
  echo "  WHERE c.contype = 'f'"
  echo "    AND NOT c.conrelid = ANY(ct.path)"
  echo "), protected(relname) AS ("
  for ((i=0; i<${#protected_tables[@]}; i++)); do
    prefix="  SELECT"
    if [[ "$i" -gt 0 ]]; then
      prefix="  UNION SELECT"
    fi
    printf "%s %s\n" "$prefix" "'${protected_tables[$i]}'"
  done
  echo ")"
  echo "SELECT DISTINCT ct.relid::regclass::text"
  echo "FROM cascade_targets ct"
  echo "JOIN protected p ON p.relname = ct.relid::regclass::text"
  echo "ORDER BY 1;"
} > "$cascade_check_sql_file"

echo "Checking TRUNCATE CASCADE impact before applying content-release tables..."
protected_hits="$(
  docker exec -i "$TARGET_DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" -tA \
    -f /dev/stdin < "$cascade_check_sql_file"
)"

if [[ -n "$protected_hits" ]]; then
  echo "Refusing to apply content-release artifact because TRUNCATE CASCADE would touch protected customer/quote tables:" >&2
  echo "$protected_hits" >&2
  echo "Use a narrower table list or an upsert-based content promotion path instead." >&2
  exit 1
fi

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

echo "Truncating content-release tables in ${TARGET_DB_CONTAINER}..."
docker exec -i "$TARGET_DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" \
  -f /dev/stdin < "$truncate_sql_file"

echo "Applying content-release artifact ${artifact}..."
gzip -dc "$artifact" | docker exec -i "$TARGET_DB_CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME"

if [[ "$SKIP_CONTENT_CHECK" != "true" ]]; then
  echo "Re-running content dependency checks after apply..."
  EFAN_TARGET_DB_CONTAINER="$TARGET_DB_CONTAINER" \
  EFAN_TARGET_DB_USER="$TARGET_DB_USER" \
  EFAN_TARGET_DB_NAME="$TARGET_DB_NAME" \
    "${repo_root}/scripts/check-content-release-sync-dependencies.sh"
fi

if [[ "$SKIP_QUOTE_CHECK" != "true" ]]; then
  echo "Re-running customer/quote dependency checks after apply..."
  EFAN_DEV_DB_CONTAINER="$TARGET_DB_CONTAINER" \
  EFAN_DEV_DB_USER="$TARGET_DB_USER" \
  EFAN_DEV_DB_NAME="$TARGET_DB_NAME" \
    "${repo_root}/scripts/check-customer-quote-sync-dependencies.sh"
fi

echo "Content-release apply completed."
