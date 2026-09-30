#!/usr/bin/env bash
# ============================================================================
#  devlog.sh — create the next developer/updates/NNN-*.txt entry
#  Usage:  ./scripts/devlog.sh "short title of what you changed"
#  Run it EVERY TIME you change the codebase, then fill in the template.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p developer/updates

slug="$(printf '%s' "${1:-update}" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//' | cut -c1-50)"
[ -n "$slug" ] || slug="update"

n=$(ls developer/updates 2>/dev/null | grep -oE '^[0-9]{3}' | sort -n | tail -1)
n=$(( ${n:-0} + 1 ))
num=$(printf '%03d' "$n")
file="developer/updates/${num}-${slug}.txt"

cat > "$file" <<EOF
UPDATE $num — $(date +%Y-%m-%d) — ${1:-update}
=========================================
STATUS: partial

WHAT I DID
  <describe in 2-6 plain sentences>

FILES CREATED
  <path> — <why>

FILES UPDATED
  <path> — <what changed and why>

FILES DELETED
  <path> — <why>

BEFORE / AFTER
  before: <old behaviour>
  after:  <new behaviour>

TESTS RUN
  npx next typegen : <pass/fail>
  npx tsc --noEmit : <pass/fail>
  npm run build     : <pass/fail>
  build_and_start   : <pass/fail>

RISKS & NOTES
  <what a future dev must know>

NEXT STEP
  <the very next thing to do>
EOF

echo "created: $file"
echo "now edit it and change STATUS: partial -> done"
