# S/ AgentOS Kernel v0.2.0 — QA Validation Report

**Generated:** 2026-05-22
**Validated by:** Claude Code (automated static analysis)
**Baseline:** v0.1.3 WorkflowMan patch line (9 PASS / 0 FAIL)

---

## Static QA Results

### scripts/static-qa.py — 9 PASS / 0 FAIL ✅
workflow_json_parseability, webhook_http_method, supabase_schema_alignment,
command_gateway_auth_patch, docker_env_operator_key, curl_tests_bash_syntax,
dashboard_js_syntax, version_alignment, openapi_present

### scripts/validate-schemas.py — 9 PASS / 0 FAIL ✅ (NEW)
All 4 schema files parseable. command.schema.json has all 11 v0.2.0 fields.
Correct enums for priority, run_mode, approval_status. No localhost $ids.

### scripts/secret-scan.py — 0 secrets detected ✅ (NEW)

### scripts/workflow-lint.py — 116 PASS / 0 FAIL ✅ (NEW)

---

## Bugs Fixed in v0.2.0

| ID | Bug | Severity | Status |
|----|-----|----------|--------|
| BUG-01 | objective not validated — missing objective silently passed | HIGH | ✅ Fixed |
| BUG-02 | evolve_agent route returned 'evolve_agent' not 'evolution_engine' | HIGH | ✅ Fixed |
| BUG-03 | Telemetry Supabase node referenced .telemetry.event_name (non-existent) | HIGH | ✅ Fixed |
| BUG-04 | Version strings were "0.1.3" in all workflow responses | MEDIUM | ✅ Fixed |

---

## New Features

- trace_id, idempotency_key, approval_status in command envelope
- run_mode validation (draft/dry_run/read_only/live)
- objective now validated as required
- Supabase migration: idempotency_keys, approval_requests, audit_log tables
- secret-scan.py, validate-schemas.py, workflow-lint.py scripts
- GitHub Actions CI (.github/workflows/static-qa.yml)
- ARCHITECTURE.md — provider-agnostic system design
- SECURITY_MODEL.md, RUNBOOK.md, ROLLBACK.md, CHANGELOG-v0.2.0.md
- openapi/s-agentos-kernel-v0.2.0.openapi.yaml — updated contract
- Curl test suite expanded from 15 → 24 tests

---

## Remaining Risks

| Risk | Severity |
|------|----------|
| No live deployment test (requires running n8n + Supabase) | MEDIUM |
| Idempotency table exists but not yet enforced in gateway routing | MEDIUM |
| Approval gate table exists but gateway not yet gated | MEDIUM |
| Supabase RLS disabled by default (operator must enable) | MEDIUM |

---

## Upgrade Safety

v0.2.0 is fully backwards compatible. New envelope fields are optional.
Supabase migration is additive. Rollback documented in ROLLBACK.md.
