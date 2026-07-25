#!/usr/bin/env bash
# Ensure the local Next.js dev server is up on :3006 so the latest changes are
# previewable. Idempotent — starts a server only when one is not already
# serving. Run it after applying changes or a merge/pull. See AGENTS.md ->
# "Local preview".
#
# Next.js dev has hot-reload, so a running server already reflects edited files;
# this script's job is only to make sure the server is actually up.
set -uo pipefail

PORT="${YARIN_DEV_PORT:-3006}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Already serving? Nothing to do.
code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/" 2>/dev/null || true)"
case "$code" in
  2* | 3*) exit 0 ;;
esac

cd "$ROOT" || exit 0
nohup pnpm dev >/tmp/yarin-dev.log 2>&1 &
exit 0
