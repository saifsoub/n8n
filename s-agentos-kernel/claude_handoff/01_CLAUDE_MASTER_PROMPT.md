# S/ AgentOS → Claude Next-Level Master Prompt

Paste this into Claude after uploading this repository or ZIP.

---

You are Claude acting as my principal platform engineer, security reviewer, n8n architect, and agentic-systems designer.

I am uploading **S/ AgentOS Kernel v0.1.3 WorkflowMan patch line**. Your job is to take it to **v0.2.0 Claude hardening line**.

This is not a chatbot project. It is a self-hosted kernel for an autonomous executive operating system built on n8n, Supabase/PostgreSQL, Docker, GPT Actions/OpenAPI, Telegram-style notifications, Groq-style inference, dashboard command/control, agent registry, telemetry, evaluation, and evolution planning.

## Your mission

Produce a production-grade upgrade, not just advice.

You must:

1. Inspect the repo/file tree first.
2. Identify critical bugs, security risks, version drift, schema inconsistencies, n8n import risks, dashboard risks, and deployment blockers.
3. Propose a minimal but powerful v0.2.0 architecture.
4. Implement or draft precise patch files.
5. Return a QA report and deployment runbook.

## Current baseline

The current package includes:

- `README.md`
- `docker-compose.yml`
- `.env.example`
- `supabase/schema.sql`
- `workflows/*.json`
- `openapi/s-agentos-kernel-v0.1.3.openapi.yaml`
- `schemas/*.json`
- `dashboard/index.html`
- `tests/curl-tests.sh`
- `scripts/static-qa.py`
- docs under `docs/`

WorkflowMan previously patched:

- Command gateway auth.
- Body/header propagation after auth.
- Support for `X-AgentOS-Key` and `Authorization: Bearer`.
- Docker Compose env passthrough.
- OpenAPI GPT Actions contract.
- Machine-readable schemas.
- Static QA report.

Static QA previously reported 9 PASS / 0 FAIL, but this was **not** a live n8n/Supabase deployment test.

## Critical constraints

- Do not include real secrets.
- Do not ask me to paste secrets into the chat.
- Preserve safe defaults: `dry_run`, `draft`, or `read_only` by default.
- No irreversible action without an approval gate.
- Keep n8n workflows importable.
- Keep webhook method POST.
- Preserve original webhook body and headers through auth/validation nodes.
- Keep backwards-compatible auth unless replacing it with something stronger.
- Never put Supabase service-role keys in browser/dashboard code.
- Prefer zero-cost/self-hosted implementation choices.

## Required v0.2.0 upgrades

### A. Security hardening

Add or design:

- Optional HMAC request signature:
  - `X-AgentOS-Signature`
  - `X-AgentOS-Timestamp`
  - replay window validation
- Idempotency:
  - `idempotency_key`
  - duplicate-command detection
  - safe replay behavior
- Approval gates:
  - draft/read-only by default
  - live actions require `approval_status=approved`
- Secret hygiene:
  - static secret scanner
  - no service role in dashboard
  - no secrets in logs
- Rate limiting strategy or documented reverse-proxy/n8n throttle strategy.

### B. Runtime command envelope

Create or upgrade the canonical command envelope:

```json
{
  "command_id": "cmd_...",
  "trace_id": "trace_...",
  "idempotency_key": "idem_...",
  "action": "create_agent",
  "requested_by": "seif",
  "priority": "low|normal|medium|high|urgent|critical",
  "run_mode": "draft|dry_run|read_only|live",
  "approval_status": "not_required|pending|approved|rejected",
  "objective": "string",
  "agent_id": "optional",
  "context": {},
  "metadata": {}
}
```

Make sure OpenAPI, JSON schemas, n8n command gateway, curl tests, and docs all align.

### C. Supabase/PostgreSQL hardening

Add or improve:

- `command_log`
- `idempotency_keys`
- `approval_requests`
- `audit_log`
- `agent_registry`
- `telemetry_events`
- `eval_runs`
- `evolution_plans`
- indexes for trace, command, agent, timestamp
- clear migration strategy
- RLS/policy notes where applicable.

### D. n8n workflow hardening

Ensure all workflows:

- Validate auth.
- Validate schema.
- Preserve body/headers.
- Emit telemetry on success and failure.
- Use consistent response envelopes.
- Avoid leaking credentials in responses.
- Handle `dry_run` and `live` safely.
- Have deterministic error paths.
- Are named/versioned consistently.

### E. Dashboard upgrade

Review and improve:

- No service-role key in frontend.
- Operator key handling should be safe.
- Show kernel status, agents, telemetry, latest commands, and approval queue.
- Add clear dry-run/live indicators.
- Add copyable curl examples that use placeholders only.

### F. OpenAPI/GPT Actions upgrade

Update the OpenAPI contract so it:

- Uses current command envelope.
- Includes examples for health, create agent, execute task, evaluate, evolve, list agents, telemetry.
- Marks consequential operations properly.
- Has clear authentication schemes.
- Does not expose secrets.
- Has stable operation IDs.

### G. QA and CI

Add:

- `scripts/secret-scan.py`
- `scripts/validate-schemas.py`
- `scripts/workflow-lint.py`
- GitHub Actions workflow for static QA
- updated `qa-validation-report.md`
- stronger curl tests:
  - no auth should fail
  - X-AgentOS-Key should pass
  - bearer should pass
  - bad action should fail
  - duplicate idempotency should not double-execute
  - dry_run should not perform live action.

## Deliverables I want back

Return the result as if you are handing back a release candidate:

1. `CHANGELOG-v0.2.0.md`
2. `UPGRADE_NOTES-v0.2.0.md`
3. `SECURITY_MODEL.md`
4. `RUNBOOK.md`
5. changed files or a patch
6. updated QA report
7. exact deployment commands
8. rollback commands
9. remaining risks

## Output style

Be direct and implementation-focused. Do not give a motivational essay. Give me the patches, commands, and the release plan.

Start by listing the current file tree and your top 10 findings.
