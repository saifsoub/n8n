# S/ AgentOS Kernel v0.2.0 — Rollback Guide

## When to roll back

- Health check returns `ok: false` after upgrade
- n8n container crashes after workflow import
- Supabase migration breaks existing queries
- Curl tests fail after deployment

---

## Roll back n8n workflow (v0.2.0 → v0.1.3)

The original v0.1.3 workflow files are preserved in the handoff ZIP. If you have them:

```bash
# 1. In n8n UI: open the Command Gateway workflow
# 2. Click the three-dot menu → Import from File
# 3. Select the v0.1.3 command gateway JSON
# 4. Save and re-activate
# 5. Verify with health check
curl -X POST "$WEBHOOK_URL" \
  -H "X-AgentOS-Key: $AGENTOS_KEY" \
  -d '{"action":"health_check","objective":"post-rollback check"}' | jq .kernel_version
```

---

## Roll back Supabase migration

The v0.2.0 migration is **additive only** (no existing tables or columns dropped).
Rolling back means dropping the new tables and columns:

```sql
-- Drop new tables (safe — they are new in v0.2.0)
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS approval_requests;
DROP TABLE IF EXISTS idempotency_keys;

-- Remove new columns from os_commands
ALTER TABLE os_commands
  DROP COLUMN IF EXISTS trace_id,
  DROP COLUMN IF EXISTS idempotency_key,
  DROP COLUMN IF EXISTS approval_status;

-- Restore original default for kernel_version
ALTER TABLE os_commands ALTER COLUMN kernel_version SET DEFAULT '0.1.3';
ALTER TABLE os_events ALTER COLUMN kernel_version SET DEFAULT '0.1.3';
```

**Note:** This rollback does NOT delete any existing command or event data.

---

## Roll back Docker/environment

If `.env` was modified:

```bash
# Restore from backup (if you made one before upgrading)
cp .env.backup .env
docker compose restart n8n
```

If no backup: manually restore changed values and restart.

---

## Verify rollback

```bash
# Should return "kernel_version": "0.1.3"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-AgentOS-Key: $AGENTOS_KEY" \
  -d '{"action":"health_check","objective":"rollback verification"}' | jq .
```

---

## Prevention

Before any upgrade:
```bash
# 1. Backup .env
cp .env .env.backup.$(date +%Y%m%d)

# 2. Export current n8n workflows from the UI (Settings → Export)

# 3. Note current Supabase table counts
curl "$SUPABASE_URL/rest/v1/os_commands?select=count" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" | jq .
```
