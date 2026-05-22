# Acceptance Tests for Claude v0.2.0 Output

Claude's upgrade is acceptable only if these checks pass or are explicitly marked as not implemented with a clear reason.

## Repository-level checks

- [ ] All JSON files parse.
- [ ] All workflow JSON files parse.
- [ ] All n8n webhook nodes use POST.
- [ ] No `.env` file with real values is included.
- [ ] No obvious secrets are present.
- [ ] Version references are aligned to `v0.2.0`.
- [ ] README quickstart matches actual filenames.
- [ ] Import order is documented.

## OpenAPI checks

- [ ] OpenAPI parses as YAML.
- [ ] Server URL is placeholder-only.
- [ ] Auth schemes are defined.
- [ ] Consequential operations are marked appropriately.
- [ ] Examples use the canonical command envelope.
- [ ] Operation IDs are stable and descriptive.

## Schema checks

- [ ] Command schema includes `command_id`, `trace_id`, `idempotency_key`, `action`, `requested_by`, `priority`, `run_mode`, `approval_status`, `objective`, `context`.
- [ ] Priority enum is consistent everywhere.
- [ ] Run-mode enum is consistent everywhere.
- [ ] Approval-status enum is consistent everywhere.
- [ ] Response schema is defined.

## n8n workflow checks

- [ ] Auth node preserves original `body` and `headers`.
- [ ] Unauthorized requests return 401/403.
- [ ] Invalid commands return 400.
- [ ] Failure path emits telemetry.
- [ ] Success path emits telemetry.
- [ ] Duplicate idempotency key path is safe.
- [ ] Live write actions require approval.
- [ ] Dry-run actions do not execute external side effects.

## Supabase/PostgreSQL checks

- [ ] Required tables exist.
- [ ] Required columns exist.
- [ ] Indexes exist for `trace_id`, `command_id`, `agent_id`, and timestamps.
- [ ] Idempotency table exists.
- [ ] Approval table exists.
- [ ] Audit table exists.
- [ ] RLS/security notes exist.

## Dashboard checks

- [ ] No service-role key in frontend.
- [ ] No hardcoded operator key.
- [ ] Live mode is visibly dangerous and gated.
- [ ] Curl examples use placeholders.
- [ ] Dashboard does not silently store secrets in localStorage.

## CLI/test checks

- [ ] `python3 scripts/static-qa.py` passes.
- [ ] `python3 scripts/secret-scan.py` passes.
- [ ] `python3 scripts/validate-schemas.py` passes.
- [ ] `python3 scripts/workflow-lint.py` passes.
- [ ] `bash -n tests/curl-tests.sh` passes.
- [ ] Curl tests include auth failure and auth success cases.
