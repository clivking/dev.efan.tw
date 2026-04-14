#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  EFAN_WWW_HOST=user@host \
  EFAN_WWW_PATH=/path/to/www/repo \
  EFAN_WWW_COMPOSE_FILE=compose.www.yaml \
  [EFAN_WWW_BASE_URL=https://www.efan.tw] \
  [EFAN_WWW_SOURCE_REF=HEAD] \
  ./scripts/deploy-to-www.sh [--allow-dirty]
EOF
}

if [[ -z "${EFAN_WWW_HOST:-}" || -z "${EFAN_WWW_PATH:-}" || -z "${EFAN_WWW_COMPOSE_FILE:-}" ]]; then
  usage >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cmd=(
  "${repo_root}/scripts/deploy-release.sh"
  --env-name www
  --target-host "${EFAN_WWW_HOST}"
  --target-path "${EFAN_WWW_PATH}"
  --compose-file "${EFAN_WWW_COMPOSE_FILE}"
  --source-ref "${EFAN_WWW_SOURCE_REF:-HEAD}"
)

if [[ -n "${EFAN_WWW_BASE_URL:-}" ]]; then
  cmd+=(--base-url "${EFAN_WWW_BASE_URL}")
fi

if [[ "${1:-}" == "--allow-dirty" ]]; then
  cmd+=(--allow-dirty)
fi

"${cmd[@]}"
