#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run-release-smoke-checks.sh [--env <dev|pre|www>] [--base-url <url>] [--timeout <seconds>] [--login-username <username>] [--login-password <password>]

Runs a lightweight HTTP smoke-check suite against the target environment.
If login credentials are supplied, also verifies the admin login API.
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

ENV_NAME=""
BASE_URL=""
TIMEOUT=20
LOGIN_USERNAME=""
LOGIN_PASSWORD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="$2"
      shift 2
      ;;
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --login-username)
      LOGIN_USERNAME="$2"
      shift 2
      ;;
    --login-password)
      LOGIN_PASSWORD="$2"
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

require_cmd curl

if [[ -z "$BASE_URL" ]]; then
  case "$ENV_NAME" in
    dev)
      BASE_URL="https://dev.efan.tw"
      ;;
    pre)
      BASE_URL="https://pre.efan.tw"
      ;;
    www)
      BASE_URL="https://www.efan.tw"
      ;;
    *)
      echo "Provide --env or --base-url." >&2
      usage >&2
      exit 1
      ;;
  esac
fi

BASE_URL="${BASE_URL%/}"

check_url() {
  local label="$1"
  local url="$2"
  local expect_contains="${3:-}"

  echo "Checking ${label}: ${url}"
  local body
  body="$(curl -fsSL --max-time "$TIMEOUT" "$url")"
  if [[ -n "$expect_contains" ]]; then
    if ! grep -Fq "$expect_contains" <<<"$body"; then
      echo "Smoke check failed for ${label}: expected body to contain '${expect_contains}'" >&2
      exit 1
    fi
  fi
}

check_health() {
  local url="${BASE_URL}/api/health"
  echo "Checking health API: ${url}"
  local body
  body="$(curl -fsSL --max-time "$TIMEOUT" "$url")"
  grep -Fq '"success":true' <<<"$body" || {
    echo "Health API did not report success." >&2
    exit 1
  }
}

check_login() {
  if [[ -z "$LOGIN_USERNAME" || -z "$LOGIN_PASSWORD" ]]; then
    echo "Skipping login API check because credentials were not provided."
    return
  fi

  local url="${BASE_URL}/api/auth/login"
  echo "Checking login API: ${url}"
  local body
  body="$(curl -fsSL --max-time "$TIMEOUT" -X POST "$url" \
    -H 'Content-Type: application/json' \
    --data "{\"username\":\"${LOGIN_USERNAME}\",\"password\":\"${LOGIN_PASSWORD}\"}")"
  grep -Fq '"user":' <<<"$body" || {
    echo "Login API did not return a user payload." >&2
    exit 1
  }
}

check_url "homepage" "${BASE_URL}/"
check_url "products page" "${BASE_URL}/products"
check_url "login page" "${BASE_URL}/login"
check_health
check_login

echo "Smoke checks passed for ${BASE_URL}"
