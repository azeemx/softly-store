#!/usr/bin/env bash
# ============================================================================
#  SOFTLY — database setup helper (Neon or local Postgres)
#
#  What it does, in order:
#    1. Loads DATABASE_URL from .env (never prints it)
#    2. Verifies connectivity (select 1)
#    3. Runs `npx drizzle-kit push` (no CLI flags — uses drizzle.config.ts)
#    4. Lists created tables + row counts (seed status)
#
#  Usage:   ./scripts/db-setup.sh
#  Rules:   never run this with the URL on the command line (shell history).
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

# --- read only DATABASE_URL from .env, without echoing it -------------------
if [ ! -f .env ]; then echo "ERROR: .env not found. Copy .env.example to .env first."; exit 1; fi
DATABASE_URL="$(grep -m1 '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"' | tr -d "'")"
if [ -z "$DATABASE_URL" ]; then echo "ERROR: DATABASE_URL is empty in .env"; exit 1; fi
export DATABASE_URL

# mask the credentials/host for display
# host only (no credentials): everything between "@" and "/" — safe to display
HOST="$(printf '%s' "$DATABASE_URL" | sed -E 's#^postgresql://[^@]*@##' | cut -d/ -f1)"
TARGET="[redacted credentials] @ ${HOST:-unknown}"

echo "==> 1/4  Target: $TARGET"
if printf '%s' "$DATABASE_URL" | grep -q 'sslmode='; then echo "       TLS: $(printf '%s' "$DATABASE_URL" | sed -E 's/.*sslmode=([^&]*).*/\1/')"; else echo "       TLS: not specified (add ?sslmode=verify-full for Neon)"; fi

echo "==> 2/4  Testing connection..."
if node -e '
const {Pool}=require("pg");
(async()=>{const p=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
const r=await p.query("select current_database() db, version() v");
console.log("       connected to:", r.rows[0].db);
console.log("       server:", r.rows[0].v.split(",")[0]);
await p.end();})().catch(e=>{console.error("       CONNECTION FAILED ->", e.code || e.message); process.exit(1);});'
then
  :
else
  echo ""
  echo "FIX (bottom-up): if error is 28P01 -> password is wrong/rotated; reset it in"
  echo "Neon -> Roles -> neondb_owner and paste the new string into .env."
  echo "If 3D000 -> database name wrong. If ETIMEDOUT/ENOTFOUND -> endpoint typo."
  echo "Then re-run: ./scripts/db-setup.sh"
  exit 1
fi

echo "==> 3/4  Pushing schema (drizzle-kit push)..."
if [ -t 1 ]; then
  # Interactive terminal: drizzle-kit shows statements and asks for confirmation.
  npx drizzle-kit push
else
  # Non-interactive (CI / piped): drizzle-kit cannot prompt, so auto-approve.
  echo "       non-TTY detected -> using --force (statements auto-approved)"
  echo "       PROTIP: create a Neon branch first (an instant backup) before pushing."
  npx drizzle-kit push --force
fi

echo "==> 4/4  Verifying tables..."
node -e '
const {Pool}=require("pg");
(async()=>{const p=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
const t=await p.query("select table_name from information_schema.tables where table_schema=$1 order by 1",["public"]);
if(!t.rows.length){console.error("       No tables found — schema push failed."); process.exit(1);}
console.log("       tables ("+t.rows.length+"):", t.rows.map(r=>r.table_name).join(", "));
const one=async(t)=>{try{const r=await p.query(`select count(*)::int c from ${t}`);return `${t}=${r.rows[0].c}`;}catch{return `${t}=?`;}};
const c=await Promise.all(["products","coupons","faqs","users","site_settings"].map(one));
console.log("       counts:", c.join("  "));
console.log("       If counts are 0, start the app once — the catalog seeds on first request.");
await p.end();})().catch(e=>{console.error("       VERIFY FAILED ->", e.message); process.exit(1);});'

echo ""
echo "Done. Next: start the app (npm run dev / build_and_start) and open /."
