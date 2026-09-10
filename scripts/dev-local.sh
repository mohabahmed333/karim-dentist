#!/usr/bin/env bash
#
# Run the app against a LOCAL Supabase with the WhatsApp transport faked.
#
#   Real Groq    — you see the model's actual replies and decisions
#   Fake Kapso   — nothing can reach an actual patient
#   Local DB     — production data is untouched
#
#   bash scripts/dev-local.sh                      # terminal 1
#   node --env-file=.env.development.local \       # terminal 2
#     scripts/simulate-inbound.mjs "+201001234567" "what time do you open?"
#
# Why .env.development.local and not shell variables: Next.js loads its .env
# files OVER the shell environment, so exporting KAPSO_WEBHOOK_SECRET on the
# command line does nothing — .env.local wins. But .env.development.local is
# loaded first and first-write wins, so it beats .env.local. It is deleted on
# exit so your normal `yarn dev` keeps pointing at production.
#
set -euo pipefail
cd "$(dirname "$0")/.."

OVERRIDE=".env.development.local"
cleanup() { rm -f "$OVERRIDE"; echo; echo "→ removed $OVERRIDE — yarn dev is back to normal"; }
trap cleanup EXIT INT TERM

echo "→ starting local Supabase (first run pulls images)"
supabase start >/dev/null 2>&1 || true

echo "→ applying migrations to the local database"
supabase db reset --local >/dev/null 2>&1

eval "$(supabase status -o env | sed 's/^/LOCAL_/')"
ANON=$(echo "${LOCAL_ANON_KEY}" | tr -d '"')
SERVICE=$(echo "${LOCAL_SERVICE_ROLE_KEY}" | tr -d '"')

GROQ_KEY=$(grep -E '^GROQ_API_KEY=' .env.local | cut -d= -f2- || true)
if [ -z "${GROQ_KEY}" ]; then
  echo "!  GROQ_API_KEY missing from .env.local — the responder will stay silent."
fi

cat > "$OVERRIDE" <<EOF
# Written by scripts/dev-local.sh. Deleted when it exits.
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE}
KAPSO_API_KEY=local-fake
KAPSO_PHONE_NUMBER_ID=local-fake
KAPSO_WEBHOOK_SECRET=local-test-secret
E2E_FAKE_KAPSO=1
GROQ_API_KEY=${GROQ_KEY}
EOF

DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | head -1)
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -q \
  -c "update whatsapp_ai_settings set mode='draft_only';"

cat <<'BANNER'

  ─────────────────────────────────────────────────
   Local test environment
     database    local Supabase — production safe
     WhatsApp    FAKED — nothing reaches a patient
     Groq        REAL — genuine model replies
     mode        draft_only
  ─────────────────────────────────────────────────

  Admin inbox
    http://localhost:3000/admin/support

  Send yourself a test message (second terminal)
    node --env-file=.env.development.local \
      scripts/simulate-inbound.mjs "+201001234567" "what time do you open?"

  Ctrl-C to stop and restore your normal environment.

BANNER

exec npx next dev -p 3000
