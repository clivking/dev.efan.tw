#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  deploy-release.sh \
    --env-name <pre|www> \
    --target-host <ssh-host> \
    --target-path <remote-source-dir> \
    --compose-file <compose-path> \
    [--runtime-path <remote-compose-working-dir>] \
    [--source-ref <git-ref>] \
    [--base-url <url>] \
    [--allow-dirty]

Deploys a specific Git ref to a remote host by exporting the source tree,
syncing it to the fixed remote source path, rebuilding on the remote host,
and optionally running HTTP smoke checks against the target base URL.
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

ENV_NAME=""
TARGET_HOST=""
TARGET_PATH=""
COMPOSE_FILE=""
RUNTIME_PATH=""
SOURCE_REF="HEAD"
BASE_URL=""
ALLOW_DIRTY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-name)
      ENV_NAME="$2"
      shift 2
      ;;
    --target-host)
      TARGET_HOST="$2"
      shift 2
      ;;
    --target-path)
      TARGET_PATH="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --runtime-path)
      RUNTIME_PATH="$2"
      shift 2
      ;;
    --source-ref)
      SOURCE_REF="$2"
      shift 2
      ;;
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --allow-dirty)
      ALLOW_DIRTY="true"
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

if [[ -z "$ENV_NAME" || -z "$TARGET_HOST" || -z "$TARGET_PATH" || -z "$COMPOSE_FILE" ]]; then
  usage >&2
  exit 1
fi

require_cmd git
require_cmd rsync
require_cmd ssh
require_cmd scp
require_cmd tar
require_cmd mktemp
require_cmd date

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$ALLOW_DIRTY" != "true" ]]; then
  if ! git -C "$repo_root" diff-index --quiet HEAD --; then
    echo "Working tree is dirty. Commit the intended release state or pass --allow-dirty deliberately." >&2
    exit 1
  fi
fi

git -C "$repo_root" rev-parse --verify "$SOURCE_REF" >/dev/null

commit_sha="$(git -C "$repo_root" rev-parse "$SOURCE_REF")"
branch_name="$(git -C "$repo_root" rev-parse --abbrev-ref "$SOURCE_REF" 2>/dev/null || echo detached)"
timestamp="$(date '+%Y%m%d-%H%M%S')"
runtime_path="${RUNTIME_PATH:-$TARGET_PATH}"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
export_dir="${tmp_dir}/export"
mkdir -p "$export_dir"

echo "Exporting ${SOURCE_REF} (${commit_sha})..."
git -C "$repo_root" archive "$SOURCE_REF" | tar -x -C "$export_dir"

release_root="${EFAN_BACKUP_ROOT:-/home/cliv/projects/backup-efan.tw}"
release_record_dir="${release_root}/releases/${timestamp}-${ENV_NAME}"
mkdir -p "$release_record_dir"
cat > "${release_record_dir}/manifest.txt" <<EOF
created_at=$(date --iso-8601=seconds)
environment=${ENV_NAME}
source_ref=${SOURCE_REF}
commit_sha=${commit_sha}
branch_name=${branch_name}
target_host=${TARGET_HOST}
target_path=${TARGET_PATH}
runtime_path=${runtime_path}
compose_file=${COMPOSE_FILE}
base_url=${BASE_URL}
EOF

echo "Preparing remote path ${TARGET_HOST}:${TARGET_PATH}..."
ssh "$TARGET_HOST" "mkdir -p '$TARGET_PATH'"

echo "Syncing release source to remote host..."
rsync -az --delete \
  --exclude '.git/' \
  --exclude 'backup/' \
  --exclude '.pnpm-store/' \
  --exclude 'app-legacy-base/public/uploads/' \
  "${export_dir}/" "${TARGET_HOST}:${TARGET_PATH}/"

echo "Writing remote release metadata..."
ssh "$TARGET_HOST" "mkdir -p '${TARGET_PATH}/.deploy-metadata'"
scp "${release_record_dir}/manifest.txt" "${TARGET_HOST}:${TARGET_PATH}/.deploy-metadata/${timestamp}-${ENV_NAME}.manifest.txt" >/dev/null

echo "Rebuilding and starting remote compose stack..."
ssh "$TARGET_HOST" "cd '$runtime_path' && docker compose -f '$COMPOSE_FILE' up -d --build"

if [[ -n "$BASE_URL" ]]; then
  echo "Running smoke checks against ${BASE_URL}..."
  "${repo_root}/scripts/run-release-smoke-checks.sh" --base-url "$BASE_URL"
fi

echo "Deploy completed for ${ENV_NAME}: ${commit_sha}"
echo "Release record: ${release_record_dir}/manifest.txt"
