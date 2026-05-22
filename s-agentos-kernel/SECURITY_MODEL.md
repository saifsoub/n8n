# S/ AgentOS Kernel v0.2.0 — Security Model

## Threat Model Summary

S/ AgentOS is a single-operator, self-hosted kernel. The primary threat surface is:

1. **Unauthorized webhook access** — someone calling the command gateway without a valid operator key
2. **Credential leakage** — secrets appearing in logs, responses, or dashboard code
3. **Replay attacks** — resubmitting captured requests to trigger duplicate live actions
4. **Consequential action abuse** — triggering `live` write actions without proper approval
5. **Supabase over-exposure** — service-role key appearing in client-side code

---

## Authentication

### Layer 1 — Operator Key

Every webhook request must include the operator key via one of:

```http
X-AgentOS-Key: <S_AGENTOS_OPERATOR_KEY>
Authorization: Bearer <S_AGENTOS_OPERATOR_KEY>
```

The key is validated in `Code — Extract & Validate Auth` (first code node in every workflow).
Both header formats are supported for compatibility with curl, GPT Actions, and API clients.

**Key requirements:**
- Minimum 32 characters
- Randomly generated: `openssl rand -base64 32`
- Never commit to version control
- Rotate immediately if exposed

### Layer 2 — HMAC Request Signing (Optional, v0.3 target)

For higher-security deployments, requests may include:

```http
X-AgentOS-Timestamp: 2026-05-22T12:00:00Z
X-AgentOS-Signature: sha256=<HMAC-SHA256(body, operator_key)>
```

This is **not yet implemented** in the n8n workflow. Add a Code node before the auth check to validate when needed.

---

## Approval Gates

### Run Modes

| Mode | Description | Live Writes Allowed? |
|------|-------------|---------------------|
| `draft` | Design/plan only, no DB writes | No |
| `dry_run` | Simulate, no external side effects | No |
| `read_only` | Read Supabase, no mutations | No |
| `live` | Full execution | Yes — requires `approval_status=approved` |

### Approval Statuses

| Status | Meaning |
|--------|--------|
| `not_required` | Action is safe (health, read, list) |
| `pending` | Waiting for operator decision |
| `approved` | Explicitly approved — live action may proceed |
| `rejected` | Operator denied — do not execute |
| `expired` | Approval window passed |

**Rule:** Any `live` action with an `approval_status` other than `approved` must be blocked.
This is enforced via the `approval_requests` table (see migration 001). The n8n gateway
should check this before executing any `live` write path (v0.3 implementation target).

---

## Idempotency

Include `idempotency_key` to prevent duplicate execution on retry:

```json
{
  "action": "create_agent",
  "objective": "...",
  "idempotency_key": "idem_create_agent_20260522_001"
}
```

The gateway normalizes this key and stores it in `idempotency_keys` table. Before executing
a `live` action, check whether the key already exists and return the cached result if found.

**Scope:** 24-hour TTL by default. After 24 hours, the same key can be reused.

---

## Credential Safety

### What must never appear in:

| Location | Forbidden |
|----------|-----------|
| Dashboard HTML/JS | `SUPABASE_SERVICE_ROLE_KEY`, `S_AGENTOS_OPERATOR_KEY` hardcoded |
| n8n Code node responses | Raw `providedToken`, `bearerToken`, or database credentials |
| Supabase event payload | Operator key values (always log `[REDACTED]`) |
| Git repository | `.env` files, real credentials |
| n8n execution logs | Any secret string |

---

## Network Security

### Required for production:

1. **HTTPS only** — n8n behind nginx/traefik with TLS. HTTP must redirect to HTTPS.
2. **Port 5678 not public** — n8n should only be reachable via reverse proxy on 443.
3. **Rate limiting** — Add nginx rate limiting on the webhook path.
4. **Firewall** — Only ports 22 (SSH key-only), 80, 443 open. Block 5678, 5432.
5. **VPN/IP allowlist** — For highest security, restrict webhook access to known IPs.

---

## Supabase Security

### Service-role key

- Used only in n8n credentials store (server-side)
- Never in dashboard code, mobile apps, or public repos
- If leaked: rotate immediately in Supabase Dashboard → Project Settings → API

### Row Level Security (RLS)

v0.2.0 ships with RLS disabled for ease of initial setup. After confirming the deployment works:

```sql
ALTER TABLE os_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
```

---

## Security Checklist — Pre-Production

- [ ] `S_AGENTOS_OPERATOR_KEY` is 32+ chars, randomly generated
- [ ] `.env` is in `.gitignore` and never committed
- [ ] HTTPS enabled with valid certificate (Let's Encrypt or commercial)
- [ ] Port 5678 bound to `127.0.0.1` only (not publicly exposed)
- [ ] n8n basic auth enabled with strong password
- [ ] Supabase service-role key stored only in n8n credentials
- [ ] `python3 scripts/secret-scan.py` passes (no secrets in repo)
- [ ] Firewall: only 22/80/443 open
- [ ] RLS enabled on Supabase tables after initial setup
- [ ] n8n execution logs reviewed — no credential values visible
- [ ] Dashboard tested: operator key input clears on tab close (sessionStorage)

---

## Incident Response

If `S_AGENTOS_OPERATOR_KEY` is compromised:
1. Generate new key: `openssl rand -base64 32`
2. Update `.env` on VPS
3. Restart n8n: `docker compose restart n8n`
4. Update GPT Actions / dashboard configuration with new key
5. Audit `os_commands` and `audit_log` for unauthorized requests

If `SUPABASE_SERVICE_ROLE_KEY` is exposed:
1. Rotate immediately in Supabase Dashboard → Project Settings → API → Service Role → Reset
2. Update n8n credentials in the UI
3. Restart n8n
4. Audit Supabase logs for unauthorized database access
