# CHANGELOG — S/ AgentOS Kernel v0.2.0

## Release: v0.2.0 Claude hardening line
**Date:** 2026-05-22

---

## Bug Fixes

### BUG-01 — `objective` field not validated (HIGH)
**File:** `workflows/s-agentos-command-gateway.json`
**Node:** `Code — Extract & Validate Payload`
**Impact:** Test 13 ("missing objective returns validation error") would silently pass commands with no objective, violating the API contract.
**Fix:** Added `objective` as a required, non-empty string field in the payload validator. Also added `run_mode` enum validation.

### BUG-02 — `evolve_agent` route name incorrect (HIGH)
**File:** `workflows/s-agentos-command-gateway.json`
**Node:** `Code — Build Evolve Agent Response`
**Impact:** Response returned `"route": "evolve_agent"` but the README, OpenAPI, and curl tests all expect `"route": "evolution_engine"`.
**Fix:** Changed `route: 'evolve_agent'` → `route: 'evolution_engine'`.

### BUG-03 — Telemetry Supabase node broken event_type reference (HIGH)
**File:** `workflows/s-agentos-command-gateway.json`
**Node:** `Supabase — Log Telemetry Event`
**Impact:** The `event_type` field referenced `$('Code — Build Telemetry Log Response').first().json.telemetry.event_name` — but the telemetry response object has no `.telemetry` property. This caused NULL inserts to `os_events.event_type`.
**Fix:** Updated `Code — Build Telemetry Log Response` to expose `event_type` directly, and fixed the Supabase node field reference to `$json.event_type`.

### BUG-04 — Version strings stale (MEDIUM)
**Files:** `workflows/s-agentos-command-gateway.json`, Supabase metadata fields
**Impact:** All workflow metadata, Supabase log payloads, and the health check response hardcoded `"0.1.3"`.
**Fix:** Updated all instances to `"0.2.0"` / `"v0.2.0"`.

---

## New Features

### FEAT-01 — Canonical v0.2.0 command envelope
**Files:** `schemas/command.schema.json`, `workflows/s-agentos-command-gateway.json`
The command envelope now includes:
- `command_id` — stable identifier
- `trace_id` — distributed trace propagation
- `idempotency_key` — safe replay key
- `approval_status` — `not_required | pending | approved | rejected | expired`
- `run_mode` — now validates `draft | dry_run | read_only | live`

### FEAT-02 — Idempotency / approval database tables
**File:** `supabase/migrations/001_v0.2.0_idempotency_approval.sql`
New tables: `idempotency_keys`, `approval_requests`, `audit_log`
New columns on `os_commands`: `trace_id`, `idempotency_key`, `approval_status`

### FEAT-03 — Secret scanner
**File:** `scripts/secret-scan.py`
Detects OpenAI, Anthropic, Groq, Supabase service-role, Telegram, Stripe, and AWS key patterns. Runs in CI and as a pre-commit check.

### FEAT-04 — JSON schema validator
**File:** `scripts/validate-schemas.py`
Validates all `schemas/*.json` files, checks the command schema has all v0.2.0 fields, and verifies correct enum values.

### FEAT-05 — n8n workflow linter
**File:** `scripts/workflow-lint.py`
Checks webhook nodes (POST only), Supabase credential names, hardcoded secret patterns in Code nodes, localhost URL leaks, and stale version strings.

### FEAT-06 — GitHub Actions CI
**File:** `.github/workflows/static-qa.yml`
Runs all static QA scripts on every push and pull request.

### FEAT-07 — Updated command schema
**File:** `schemas/command.schema.json`
Added `command_id`, `trace_id`, `idempotency_key`, `approval_status` properties. Updated `run_mode` enum from `[draft, dry_run, execute]` to `[draft, dry_run, read_only, live]`.

### FEAT-08 — Updated OpenAPI spec
**File:** `openapi/s-agentos-kernel-v0.2.0.openapi.yaml`
Updated to v0.2.0 command envelope, added new fields to request schema, updated all examples, aligned with new run_mode values.

---

## Quality Improvements

- All Supabase event log nodes now emit `"version": "0.2.0"` in metadata
- Health check response now includes `trace_id`, `run_mode`, `approval_status`, and `kernel_version: "v0.2.0"`
- All responses include consistent `kernel_version` field
- `curl-tests.sh` updated with bearer auth test, dry_run test, and improved idempotency notes

---

## Known Remaining Risks (post v0.2.0)

| Risk | Severity | Status |
|------|----------|--------|
| No live idempotency enforcement in n8n workflow (table created, not wired) | Medium | v0.3 |
| Approval gate table created but not enforced in gateway routing | Medium | v0.3 |
| Dashboard index.html not tested for CORS behavior in all browsers | Low | Ongoing |
| No automated live test against n8n + Supabase deployment | Medium | v0.3 |
| n8n workflow export/import verification not automated | Low | v0.3 |
| Supabase RLS not enabled by default | Medium | Documented — operator must enable |

---

## Upgrade Path

From v0.1.3 → v0.2.0:

1. Run `supabase/migrations/001_v0.2.0_idempotency_approval.sql` in Supabase SQL Editor
2. Import the updated `workflows/s-agentos-command-gateway.json` into n8n (replace existing)
3. Activate the updated workflow
4. Restart n8n: `docker compose restart n8n`
5. Run `bash tests/curl-tests.sh` to verify

All existing commands remain backwards compatible — new fields (`trace_id`, `idempotency_key`, etc.) are optional at the API level and generated by the gateway if not provided.
