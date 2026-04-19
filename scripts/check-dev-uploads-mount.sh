#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET_RELATIVE_PATH="${1:-products/AR-837-E/images/AR-837-E_01_front.png}"
TARGET_ABSOLUTE_PATH="/app/public/uploads/${TARGET_RELATIVE_PATH}"
HEADERS_FILE="/tmp/check-dev-uploads-mount.headers"

echo "Checking dev uploads mount"
echo "=========================="
echo "Target file: ${TARGET_ABSOLUTE_PATH}"

mount_line="$(docker compose -f compose.work-prod.yaml exec -T web sh -lc "grep '/app/public/uploads' /proc/mounts" || true)"
if [[ -z "$mount_line" ]]; then
  echo "ERROR: uploads mount is missing inside efan-dev-web"
  exit 1
fi

echo "Mount: ${mount_line}"

if [[ "$mount_line" == none\ /app/public/uploads\ tmpfs* ]]; then
  echo "ERROR: uploads mount resolved to tmpfs instead of the host bind mount"
  exit 1
fi

docker compose -f compose.work-prod.yaml exec -T web sh -lc "test -f '${TARGET_ABSOLUTE_PATH}'"
echo "OK: target file exists inside container"

curl -I --max-time 10 "http://localhost:5000/api/uploads/${TARGET_RELATIVE_PATH}" >"$HEADERS_FILE"
if ! grep -q 'HTTP/1.1 200 OK' "$HEADERS_FILE"; then
  echo "ERROR: local dev runtime did not return 200 for /api/uploads/${TARGET_RELATIVE_PATH}"
  cat "$HEADERS_FILE"
  exit 1
fi

echo "OK: local dev runtime returns 200 for the target upload"
