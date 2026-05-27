#!/usr/bin/env bash
# ================================================================
# S/ AgentOS — Post-Deploy Wiring Script for Railway
# Run this ONCE after Railway finishes deploying n8n.
# ================================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}! $*${NC}"; }
fail() { echo -e "${RED}✗ $*${NC}"; exit 1; }

SUPABASE_HOST="https://nrjfbqgvigankejaajrt.supabase.co"
OPERATOR_KEY="749e3732d0bac1e1ba98730e4ceeb9e8273f394a5e56e912"
RAW_BASE="https://raw.githubusercontent.com/saifsoub/n8n/claude/inspect-and-deploy-akbdM/s-agentos-kernel/workflows"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  S/ AgentOS — Railway Post-Deploy Wire  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Collect inputs ─────────────────────────────────────────
if [ -z "$N8N_URL" ]; then
  echo "Your Railway n8n URL (e.g. https://n8n-production-xxxx.up.railway.app):"
  read -r N8N_URL
fi
N8N_URL="${N8N_URL%/}"

if [ -z "$N8N_API_KEY" ]; then
  echo "n8n API key (n8n UI → Settings → n8n API → Create):"
  read -rs N8N_API_KEY; echo ""
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Supabase service_role key:"
  read -rs SUPABASE_SERVICE_ROLE_KEY; echo ""
fi

[ -z "$N8N_URL" ]                  && fail "N8N_URL required"
[ -z "$N8N_API_KEY" ]              && fail "N8N_API_KEY required"
[ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && fail "SUPABASE_SERVICE_ROLE_KEY required"

AUTH="X-N8N-API-KEY: $N8N_API_KEY"

# ── Wait for n8n ────────────────────────────────────────────
echo "Waiting for n8n at $N8N_URL ..."
for i in $(seq 1 20); do
  curl -sf "$N8N_URL/healthz" -o /dev/null 2>/dev/null && break
  echo -n "."; sleep 3
done
curl -sf "$N8N_URL/healthz" -o /dev/null || fail "n8n not reachable at $N8N_URL"
ok "n8n is online"

# ── Create Supabase credential ──────────────────────────────
echo ""
echo "Creating Supabase API credential..."
CRED=$(curl -sf -X POST "$N8N_URL/api/v1/credentials" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"name\":\"Supabase API\",\"type\":\"supabaseApi\",\"data\":{\"host\":\"$SUPABASE_HOST\",\"serviceRole\":\"$SUPABASE_SERVICE_ROLE_KEY\"}}" 2>&1) \
  || { warn "Credential may already exist — continuing"; CRED="{}"; }
CRED_ID=$(echo "$CRED" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$CRED_ID" ] && ok "Supabase API credential created (id: $CRED_ID)" \
  || warn "Could not parse credential id"

# ── Import + activate workflows ─────────────────────────────
WORKFLOWS=(
  "s-agentos-command-gateway.json"
  "s-agentos-agent-registry-service.json"
  "s-agentos-telemetry-logger.json"
  "s-agentos-evolution-planner.json"
)

echo ""
echo "Importing workflows from GitHub..."
ACTIVATED=0
for WF in "${WORKFLOWS[@]}"; do
  WF_JSON=$(curl -sf "$RAW_BASE/$WF") || { warn "Could not fetch $WF"; continue; }
  RESP=$(echo "$WF_JSON" | curl -sf -X POST "$N8N_URL/api/v1/workflows" \
    -H "$AUTH" -H "Content-Type: application/json" -d @- 2>&1) \
    || { warn "Failed to import $WF"; continue; }
  WF_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  WF_ID=${WF_ID:-$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)}
  [ -z "$WF_ID" ] && { warn "Imported $WF but could not parse id"; continue; }
  ok "Imported $WF (id: $WF_ID)"
  curl -sf -X PATCH "$N8N_URL/api/v1/workflows/$WF_ID" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"active":true}' -o /dev/null && ok "Activated" || warn "Activate manually in UI"
  ACTIVATED=$((ACTIVATED+1))
done

# ── Update WEBHOOK_URL env hint ─────────────────────────────
warn "Set WEBHOOK_URL=$N8N_URL/ in Railway env vars so webhooks resolve correctly"

# ── Smoke test ───────────────────────────────────────────────
echo ""
echo "Smoke test..."
SMOKE=$(curl -sf -X POST "$N8N_URL/webhook/s-agentos-command" \
  -H "X-AgentOS-Key: $OPERATOR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"health_check","objective":"ping"}' 2>&1) || SMOKE=""
echo "$SMOKE" | grep -q '"ok":true' \
  && ok "Health check passed — $(echo "$SMOKE" | grep -o '"kernel_version":"[^"]*"')" \
  || warn "Smoke test inconclusive — workflows may need a moment"

# ── Done ────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Done                                                ║"
echo "╠══════════════════════════════════════════════════════╣"
printf "║  Workflows activated : %-3s                          ║\n" "$ACTIVATED"
printf "║  n8n URL : %-42s║\n" "$N8N_URL"
echo "║  Operator key:                                       ║"
printf "║  %-54s║\n" "$OPERATOR_KEY"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Test:"
echo "  curl -X POST $N8N_URL/webhook/s-agentos-command \\"
echo "    -H 'X-AgentOS-Key: $OPERATOR_KEY' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"action\":\"health_check\",\"objective\":\"ping\"}'"
echo ""
