#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "[dev-refresh] Building app-dev image..."
docker compose build app-dev

echo "[dev-refresh] Recreating app-dev container..."
docker compose up -d --force-recreate app-dev

echo "[dev-refresh] Done. Verify at https://dev.efan.tw/"
