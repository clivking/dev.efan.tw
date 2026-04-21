#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  create-portable-backup.sh \
    --env-name <dev|www|pre> \
    --backup-root <dir> \
    --repo-path <dir> \
    --db-container <name> \
    --db-user <user> \
    --db-name <name> \
    --uploads-path <dir> \
    [--compose-file <path>] \
    [--env-file <path>] \
    [--extra-path <path>]...

Creates a portable backup package with DB dump, uploads archive, source snapshot,
selected environment files, infrastructure files, checksums, and a restore note.
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

resolve_path() {
  python3 - <<'PY' "$1" "${2:-false}"
from pathlib import Path
import sys

path = Path(sys.argv[1]).expanduser()
allow_missing = sys.argv[2].lower() == "true"

if allow_missing:
    print(path.resolve(strict=False))
else:
    print(path.resolve())
PY
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

rel_or_abs() {
  python3 - <<'PY' "$1" "$2"
from pathlib import Path
import sys

path = Path(sys.argv[1]).resolve()
root = Path(sys.argv[2]).resolve()
try:
    print(path.relative_to(root))
except ValueError:
    print(path)
PY
}

copy_if_exists() {
  local src="$1"
  local dest_dir="$2"
  if [[ -e "$src" ]]; then
    cp -a "$src" "$dest_dir/"
  else
    echo "Warning: path not found, skipping: $src" >&2
  fi
}

checksum_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$@"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$@"
  else
    echo "Missing required command: sha256sum or shasum" >&2
    exit 1
  fi
}

ENV_NAME=""
BACKUP_ROOT=""
REPO_PATH=""
DB_CONTAINER=""
DB_USER=""
DB_NAME=""
UPLOADS_PATH=""
COMPOSE_FILE=""
ENV_FILE=""
declare -a EXTRA_PATHS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-name)
      ENV_NAME="$2"
      shift 2
      ;;
    --backup-root)
      BACKUP_ROOT="$2"
      shift 2
      ;;
    --repo-path)
      REPO_PATH="$2"
      shift 2
      ;;
    --db-container)
      DB_CONTAINER="$2"
      shift 2
      ;;
    --db-user)
      DB_USER="$2"
      shift 2
      ;;
    --db-name)
      DB_NAME="$2"
      shift 2
      ;;
    --uploads-path)
      UPLOADS_PATH="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --extra-path)
      EXTRA_PATHS+=("$2")
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

if [[ -z "$ENV_NAME" || -z "$BACKUP_ROOT" || -z "$REPO_PATH" || -z "$DB_CONTAINER" || -z "$DB_USER" || -z "$DB_NAME" || -z "$UPLOADS_PATH" ]]; then
  usage >&2
  exit 1
fi

require_cmd docker
require_cmd gzip
require_cmd tar
require_cmd date
require_cmd python3

REPO_PATH="$(resolve_path "$REPO_PATH")"
BACKUP_ROOT="$(resolve_path "$BACKUP_ROOT" true)"
UPLOADS_PATH="$(resolve_path "$UPLOADS_PATH")"
if [[ -n "$COMPOSE_FILE" ]]; then
  COMPOSE_FILE="$(resolve_path "$COMPOSE_FILE")"
fi
if [[ -n "$ENV_FILE" ]]; then
  ENV_FILE="$(resolve_path "$ENV_FILE")"
fi

timestamp="$(date '+%Y%m%d-%H%M%S')"
backup_dir="${BACKUP_ROOT}/${timestamp}-${ENV_NAME}"
mkdir -p "$backup_dir"/{code,db,uploads,env,infra,checksums}

db_dump_name="efan-${ENV_NAME}-${timestamp}.sql.gz"
uploads_name="efan-${ENV_NAME}-uploads-${timestamp}.tar.gz"
repo_name="efan-${ENV_NAME}-repo-${timestamp}.tar.gz"

echo "Creating DB dump from container ${DB_CONTAINER}..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "${backup_dir}/db/${db_dump_name}"

echo "Archiving uploads from ${UPLOADS_PATH}..."
tar -C "$(dirname "$UPLOADS_PATH")" -czf "${backup_dir}/uploads/${uploads_name}" "$(basename "$UPLOADS_PATH")"

echo "Archiving repository snapshot from ${REPO_PATH}..."
tar \
  -C "$(dirname "$REPO_PATH")" \
  --exclude="$(basename "$REPO_PATH")/.git" \
  --exclude="$(basename "$REPO_PATH")/backup" \
  --exclude="$(basename "$REPO_PATH")/.pnpm-store" \
  --exclude="$(basename "$REPO_PATH")/app-legacy-base/node_modules" \
  --exclude="$(basename "$REPO_PATH")/app/node_modules" \
  -czf "${backup_dir}/code/${repo_name}" \
  "$(basename "$REPO_PATH")"

if [[ -n "$ENV_FILE" ]]; then
  echo "Copying env file ${ENV_FILE}..."
  copy_if_exists "$ENV_FILE" "${backup_dir}/env"
fi

if [[ -n "$COMPOSE_FILE" ]]; then
  echo "Copying compose file ${COMPOSE_FILE}..."
  copy_if_exists "$COMPOSE_FILE" "${backup_dir}/infra"
fi

for extra_path in "${EXTRA_PATHS[@]}"; do
  extra_path="$(resolve_path "$extra_path")"
  echo "Copying extra path ${extra_path}..."
  copy_if_exists "$extra_path" "${backup_dir}/infra"
done

cat > "${backup_dir}/manifest.json" <<EOF
{
  "created_at": "$(date --iso-8601=seconds)",
  "environment": "$(json_escape "$ENV_NAME")",
  "backup_root": "$(json_escape "$BACKUP_ROOT")",
  "backup_dir": "$(json_escape "$backup_dir")",
  "repo_path": "$(json_escape "$REPO_PATH")",
  "db_container": "$(json_escape "$DB_CONTAINER")",
  "db_user": "$(json_escape "$DB_USER")",
  "db_name": "$(json_escape "$DB_NAME")",
  "uploads_path": "$(json_escape "$UPLOADS_PATH")",
  "artifacts": {
    "db_dump": "db/$(json_escape "$db_dump_name")",
    "uploads_archive": "uploads/$(json_escape "$uploads_name")",
    "repo_archive": "code/$(json_escape "$repo_name")"
  }
}
EOF

cat > "${backup_dir}/restore-notes.md" <<EOF
# Restore Notes

- Environment: \`${ENV_NAME}\`
- Backup created at: \`$(date --iso-8601=seconds)\`
- DB source container: \`${DB_CONTAINER}\`
- DB name: \`${DB_NAME}\`

## Restore Intent

This backup is intended to help restore the \`${ENV_NAME}\` environment onto a new machine without relying on Docker volumes from the old machine.

## Minimum Restore Sequence

1. Restore the repository snapshot from \`code/${repo_name}\`
2. Restore env and infra files from \`env/\` and \`infra/\`
3. Recreate containers from the restored source and compose files
4. Restore the database dump from \`db/${db_dump_name}\`
5. Restore uploads from \`uploads/${uploads_name}\`
6. Run post-restore smoke checks for homepage, admin, products, customers, quotes, and uploads

## Notes

- Validate secret compatibility before using a restored DB snapshot
- Keep this backup together with the checksum file in \`checksums/sha256.txt\`
EOF

(
  cd "$backup_dir"
  while IFS= read -r -d '' file; do
    checksum_file "$file"
  done < <(find . -type f ! -path './checksums/*' -print0 | sort -z) > checksums/sha256.txt
)

echo "Backup created at: ${backup_dir}"
echo "Checksum file: ${backup_dir}/checksums/sha256.txt"
