#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run-customer-quote-sync.sh \
    --artifact <path/to/customer-quote-sync.sql.gz> \
    [--dev-backup] \
    [--target-db-container <name>] \
    [--target-db-user <user>] \
    [--target-db-name <db>] \
    [--skip-precheck] \
    [--skip-post-smoke]

Runs the Step 3 selective sync workflow on dev:
1. optional dev portable backup
2. dependency precheck
3. selective apply
4. optional post-sync smoke checks
EOF
}

ARTIFACT=""
DO_DEV_BACKUP="false"
TARGET_DB_CONTAINER="${EFAN_DEV_DB_CONTAINER:-efan-work-db}"
TARGET_DB_USER="${EFAN_DEV_DB_USER:-efan_work}"
TARGET_DB_NAME="${EFAN_DEV_DB_NAME:-efan_working_copy}"
SKIP_PRECHECK="false"
SKIP_POST_SMOKE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --artifact)
      ARTIFACT="$2"
      shift 2
      ;;
    --dev-backup)
      DO_DEV_BACKUP="true"
      shift
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
    --skip-precheck)
      SKIP_PRECHECK="true"
      shift
      ;;
    --skip-post-smoke)
      SKIP_POST_SMOKE="true"
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

if [[ -z "$ARTIFACT" ]]; then
  usage >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$DO_DEV_BACKUP" == "true" ]]; then
  echo "[1/4] Creating dev portable backup..."
  "${repo_root}/scripts/backup-dev-portable.sh"
else
  echo "[1/4] Skipping dev portable backup."
fi

if [[ "$SKIP_PRECHECK" != "true" ]]; then
  echo "[2/4] Running dependency precheck..."
  EFAN_DEV_DB_CONTAINER="$TARGET_DB_CONTAINER" \
  EFAN_DEV_DB_USER="$TARGET_DB_USER" \
  EFAN_DEV_DB_NAME="$TARGET_DB_NAME" \
    "${repo_root}/scripts/check-customer-quote-sync-dependencies.sh"
else
  echo "[2/4] Skipping dependency precheck."
fi

echo "[3/4] Applying selective customer/quote sync artifact..."
apply_cmd=(
  "${repo_root}/scripts/apply-customer-quote-domain.sh"
  --artifact "$ARTIFACT" \
  --target-db-container "$TARGET_DB_CONTAINER" \
  --target-db-user "$TARGET_DB_USER" \
  --target-db-name "$TARGET_DB_NAME"
)

if [[ "$SKIP_PRECHECK" == "true" ]]; then
  apply_cmd+=(--skip-dependency-check)
fi

"${apply_cmd[@]}"

if [[ "$SKIP_POST_SMOKE" != "true" ]]; then
  echo "[4/4] Running post-sync smoke checks..."
  "${repo_root}/scripts/run-release-smoke-checks.sh" --env dev
else
  echo "[4/4] Skipping post-sync smoke checks."
fi

echo "Selective customer/quote sync workflow completed."
