#!/usr/bin/env bash
# Deploy recipe for attestr: a static build rsynced into the web root, with no
# service of its own.
#
# Run by the host deploy watcher (nostr-deploy-watch) after it fast-forwards
# this checkout to the tip published on Nostr. The watcher owns pulling from the
# GRASP servers, the public-URL inventory and the post-deploy URL check; this
# file owns everything specific to building and publishing attestr.
#
# Contract:
#   - runs as the deploy user, with the repository root as the working directory
#   - exits non-zero on any failure, so the watcher records a failed deploy
#   - leaves no tracked file modified: a dirty checkout cannot be fast-forwarded
set -euo pipefail

cd "$(dirname "$0")/.."

APP=attestr
WEB_ROOT=/var/www/attestr
log() { printf '[%s] %s\n' "$APP" "$*"; }

# Tracked files only: an untracked build artefact or helper script sits happily
# there and does not stop git taking the tip, so it is not a reason to refuse.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  log "refusing to deploy: the checkout has modified tracked files"
  git status --porcelain --untracked-files=no
  exit 1
fi

log "building $(git rev-parse --short HEAD)"
npm ci --no-audit --no-fund
npm run build

log "rsyncing dist/ to ${WEB_ROOT}"
sudo rsync -a --delete dist/ "${WEB_ROOT}/"

log "deployed $(git rev-parse --short HEAD)"
