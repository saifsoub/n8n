# S/ AgentOS Kernel v0.2.0 — Runbook

## Fresh Deployment (v0.2.0)

### Prerequisites

- VPS: Ubuntu 22.04+, 2 vCPU, 4GB RAM, 20GB SSD
- Docker Engine 24.0+ and Docker Compose v2
- A domain name with DNS pointed to your VPS
- A Supabase account (free tier sufficient)

---

### Step 1 — Clone and configure

```bash
git clone <your-repo-url> s-agentos && cd s-agentos
cp .env.example .env
nano .env
```

Fill in `.env`:

```bash
N8N_HOST=agentos.yourdomain.com
N8N_PROTOCOL=https
N8N_PORT=5678
N8N_ENCRYPTION_KEY=$(openssl rand -base64 24)
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 16)
N8N_WEBHOOK_URL=https://agentos.yourdomain.com/

POSTGRES_DB=n8n
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=$(openssl rand -base64 16)
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=<same as POSTGRES_PASSWORD>

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

S_AGENTOS_KERNEL_VERSION=0.2.0
S_AGENTOS_OPERATOR_KEY=$(openssl rand -base64 32)
S_AGENTOS_API_TOKEN=<same as S_AGENTOS_OPERATOR_KEY>
```

---

### Step 2 — Apply Supabase schema

1. Open Supabase → SQL Editor
2. Run `supabase/schema.sql` (creates base tables)
3. Run `supabase/migrations/001_v0.2.0_idempotency_approval.sql` (adds v0.2.0 tables)
4. Verify tables in Supabase → Table Editor:
   - `os_commands`, `os_events`, `agent_registry`, `agent_runs`
   - `eval_results`, `evolution_plans`, `workflow_registry`, `model_registry`
   - `idempotency_keys`, `approval_requests`, `audit_log`

---

### Step 3 — Start Docker services

```bash
docker compose up -d
docker compose logs -f n8n   # Wait for "Editor is now accessible"
```

---

### Step 4 — Configure n8n Supabase credential

1. Open `https://agentos.yourdomain.com:5678`
2. Log in with `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD`
3. Go to Settings → Credentials → Add Credential → Supabase API
4. Enter:
   - Host: `https://your-project.supabase.co`
   - Service Role Key: `eyJ...your-service-role-key`
5. Save as **"Supabase API"** (exact name required by workflows)

---

### Step 5 — Import workflows (in order)

Import each file from `workflows/` in this order:

| Order | File | Notes |
|-------|------|-------|
| 1 | `s-agentos-command-gateway.json` | Primary gateway — activate first |
| 2 | `s-agentos-agent-registry-service.json` | Registry CRUD |
| 3 | `s-agentos-telemetry-logger.json` | Event logging |
| 4 | `s-agentos-evolution-planner.json` | Evolution planning |

For each: Workflows → Import from File → select JSON → Save → Activate.

---

### Step 6 — Run curl tests

```bash
export WEBHOOK_URL="https://agentos.yourdomain.com/webhook/s-agentos-command"
export AGENTOS_KEY="$(grep S_AGENTOS_OPERATOR_KEY .env | cut -d= -f2)"
export REGISTRY_URL="https://agentos.yourdomain.com/webhook/s-agentos-registry"
export TELEMETRY_URL="https://agentos.yourdomain.com/webhook/s-agentos-telemetry"
export EVOLUTION_URL="https://agentos.yourdomain.com/webhook/s-agentos-evolution"

bash tests/curl-tests.sh
```

Expected: **17 passed, 0 failed**

---

### Step 7 — Open dashboard

```bash
cd dashboard
python3 -m http.server 8080
# Open http://localhost:8080
```

Enter your webhook URL and operator key. Click **Save to Session**.

---

## Upgrade from v0.1.3 → v0.2.0

```bash
# 1. Pull new code
git pull origin main

# 2. Apply migration (Supabase SQL Editor)
#    Run: supabase/migrations/001_v0.2.0_idempotency_approval.sql

# 3. Re-import the updated command gateway in n8n
#    (other workflows unchanged)

# 4. Restart n8n to pick up any env changes
docker compose restart n8n

# 5. Verify
bash tests/curl-tests.sh
python3 scripts/static-qa.py
```

---

## Common Operations

### Health check

```bash
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-AgentOS-Key: $AGENTOS_KEY" \
  -d '{"action":"health_check","objective":"Check kernel status"}' | jq .
```

### Create agent (dry_run)

```bash
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-AgentOS-Key: $AGENTOS_KEY" \
  -d '{
    "action": "create_agent",
    "objective": "Create a revenue monitoring agent",
    "run_mode": "draft",
    "context": {
      "domain": "revenue operations",
      "output_format": "Telegram alert"
    }
  }' | jq .
```

### List agents

```bash
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-AgentOS-Key: $AGENTOS_KEY" \
  -d '{"action":"list_agents","objective":"List all registered agents"}' | jq .
```

### Rotate operator key

```bash
NEW_KEY=$(openssl rand -base64 32)
sed -i "s/^S_AGENTOS_OPERATOR_KEY=.*/S_AGENTOS_OPERATOR_KEY=$NEW_KEY/" .env
sed -i "s/^S_AGENTOS_API_TOKEN=.*/S_AGENTOS_API_TOKEN=$NEW_KEY/" .env
docker compose restart n8n
echo "New key: $NEW_KEY"
```

---

## Logs and Diagnostics

```bash
# n8n container logs
docker compose logs --tail 100 n8n

# Supabase query (last 20 commands)
curl "$SUPABASE_URL/rest/v1/os_commands?order=created_at.desc&limit=20" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq .

# Supabase query (last 20 events)
curl "$SUPABASE_URL/rest/v1/os_events?order=created_at.desc&limit=20" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq .
```

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 404 from webhook | Workflow not activated | Activate in n8n UI |
| `ok: false, "Unauthorized"` | Wrong operator key | Check `AGENTOS_KEY` matches `.env` |
| `ok: false, "Validation Failed"` | Missing `action` or `objective` | Add both fields to request body |
| Supabase insert fails | Wrong service-role key or schema not applied | Re-check n8n credentials; re-run schema.sql |
| n8n keeps restarting | Bad `.env` or port conflict | `docker compose logs n8n`; check `.env` syntax |
| Dashboard can't connect | CORS from file:// | Serve with `python3 -m http.server 8080` |
