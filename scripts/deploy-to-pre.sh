#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  EFAN_PRE_HOST=user@host \
  EFAN_PRE_PATH=/path/to/pre/repo \
  EFAN_PRE_COMPOSE_FILE=compose.pre.yaml \
  [EFAN_PRE_BASE_URL=https://pre.efan.tw] \
  [EFAN_PRE_SOURCE_REF=HEAD] \
  ./scripts/deploy-to-pre.sh [--allow-dirty]
EOF
}

if [[ -z "${EFAN_PRE_HOST:-}" || -z "${EFAN_PRE_PATH:-}" || -z "${EFAN_PRE_COMPOSE_FILE:-}" ]]; then
  usage >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cmd=(
  "${repo_root}/scripts/deploy-release.sh"
  --env-name pre
  --target-host "${EFAN_PRE_HOST}"
  --target-path "${EFAN_PRE_PATH}"
  --compose-file "${EFAN_PRE_COMPOSE_FILE}"
  --source-ref "${EFAN_PRE_SOURCE_REF:-HEAD}"
)

if [[ -n "${EFAN_PRE_BASE_URL:-}" ]]; then
  cmd+=(--base-url "${EFAN_PRE_BASE_URL}")
fi

if [[ "${1:-}" == "--allow-dirty" ]]; then
  cmd+=(--allow-dirty)
fi

"${cmd[@]}"
