#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

VPS_ALIAS="${VPS_ALIAS:-vps}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/attestr}"
SITE_URL="${SITE_URL:-https://attestr.xyz}"

echo "[deploy] Building project..."
npm run build --prefix "${PROJECT_ROOT}"

echo "[deploy] Syncing dist to ${VPS_ALIAS}:${REMOTE_PATH}..."
rsync -az --delete "${PROJECT_ROOT}/dist/" "${VPS_ALIAS}:${REMOTE_PATH}/"

echo "[deploy] Verifying ${SITE_URL}..."
HTTP_CODE="$(curl -s -o /tmp/attestr_deploy_check.html -w "%{http_code}" "${SITE_URL}")"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "[deploy] Failed: ${SITE_URL} returned HTTP ${HTTP_CODE}" >&2
  exit 1
fi

echo "[deploy] Success: ${SITE_URL} returned HTTP 200"
