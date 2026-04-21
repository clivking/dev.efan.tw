#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run-content-release-sync.sh \
    --artifact <path/to/content-release-sync.sql.gz> \
    [--target-db-container <name>] \
    [--target-db-user <user>] \
    [--target-db-name <db>] \
    [--target-env <pre|www>] \
    [--skip-content-check] \
    [--skip-quote-check] \
    [--skip-post-smoke]

Runs the Step 5 release-owned content sync workflow:
1. apply release-owned content tables
2. run dependency checks
3. optionally run smoke checks against the target environment
EOF
}

ARTIFACT=""
TARGET_DB_CONTAINER="${EFAN_TARGET_DB_CONTAINER:-efan_nextjs_db}"
TARGET_DB_USER="${EFAN_TARGET_DB_USER:-efan_pro_user}"
TARGET_DB_NAME="${EFAN_TARGET_DB_NAME:-efantw_pro_db}"
TARGET_ENV="www"
SKIP_CONTENT_CHECK="false"
SKIP_QUOTE_CHECK="false"
SKIP_POST_SMOKE="false"

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
    --target-env)
      TARGET_ENV="$2"
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

echo "[1/2] Applying release-owned content domain..."
apply_cmd=(
  "${repo_root}/scripts/apply-content-release-domain.sh"
  --artifact "$ARTIFACT"
  --target-db-container "$TARGET_DB_CONTAINER"
  --target-db-user "$TARGET_DB_USER"
  --target-db-name "$TARGET_DB_NAME"
)

if [[ "$SKIP_CONTENT_CHECK" == "true" ]]; then
  apply_cmd+=(--skip-content-check)
fi

if [[ "$SKIP_QUOTE_CHECK" == "true" ]]; then
  apply_cmd+=(--skip-quote-check)
fi

"${apply_cmd[@]}"

if [[ "$SKIP_POST_SMOKE" != "true" ]]; then
  echo "[2/2] Running post-sync smoke checks..."
  "${repo_root}/scripts/run-release-smoke-checks.sh" --env "$TARGET_ENV"
else
  echo "[2/2] Skipping post-sync smoke checks."
fi

echo "Content-release sync workflow completed."
