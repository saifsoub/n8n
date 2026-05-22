# v0.2.0 Upgrade Specification — S/ AgentOS Kernel

## Target outcome

Transform v0.1.3 from a static-validated kernel into a production-ready, operator-safe v0.2.0 release candidate.

The target release should be:

- safer by default
- easier to deploy
- harder to misuse
- easier to test
- clearer for GPT Actions
- cleaner for n8n imports
- stronger for agent lifecycle governance

## Minimum viable v0.2.0

### 1. Version alignment

All references should consistently say:

```text
S/ AgentOS Kernel v0.2.0
```

Known drift to investigate:

- README appears to say `v0.1.3.3`.
- `.env.example` appears to have a `v0.1` header.
- OpenAPI currently says `0.1.3`.

### 2. Canonical command envelope

Every action should use the same command format:

```json
{
  "command_id": "cmd_20260522_...",
  "trace_id": "trace_...",
  "idempotency_key": "idem_...",
  "action": "health_check",
  "objective": "Check kernel status",
  "requested_by": "seif",
  "priority": "low",
  "run_mode": "dry_run",
  "approval_status": "not_required",
  "agent_id": null,
  "context": {},
  "metadata": {
    "client": "gpt_action"
  }
}
```

### 3. Response envelope

Every workflow should return a consistent response:

```json
{
  "ok": true,
  "kernel_version": "v0.2.0",
  "trace_id": "trace_...",
  "command_id": "cmd_...",
  "action": "health_check",
  "run_mode": "dry_run",
  "approval_status": "not_required",
  "result": {},
  "warnings": [],
  "errors": []
}
```

### 4. Idempotency

Add a workflow/database approach that prevents duplicate live execution when the same `idempotency_key` is submitted again.

For duplicate requests:

- return the original result if available
- or return a safe duplicate notice
- never double-execute live actions

### 5. Auth hardening

Preserve the current simple operator-key model, then optionally add HMAC.

Accept:

```http
X-AgentOS-Key: <operator-key>
Authorization: Bearer <operator-key>
```

Optional stronger headers:

```http
X-AgentOS-Timestamp: 2026-05-22T00:00:00Z
X-AgentOS-Signature: sha256=<hmac>
```

### 6. Approval gate

Suggested statuses:

```text
not_required
pending
approved
rejected
expired
```

Suggested run modes:

```text
draft
dry_run
read_only
live
```

Rules:

- `live` write actions require `approval_status=approved`
- agent creation can draft by default
- live Telegram/payment/external-service actions need explicit approval
- health/read-only/list actions do not need approval

### 7. Security scanning

Add a simple scanner that detects common secret patterns:

- `sk-...`
- Telegram bot token format
- Supabase service role keys
- OpenAI/Anthropic/Groq-style keys
- JWT-looking strings
- accidental `.env` inclusion

### 8. Dashboard safety

The dashboard should never embed:

- Supabase service role key
- operator key in code
- real webhook URL with secrets
- hardcoded bearer tokens

Prefer:

- manual session-only operator key input
- no localStorage unless clearly opted into
- visible warning when live mode is selected

### 9. CI

Add `.github/workflows/static-qa.yml` with:

```bash
python3 scripts/static-qa.py
python3 scripts/validate-schemas.py
python3 scripts/secret-scan.py
python3 scripts/workflow-lint.py
bash -n tests/curl-tests.sh
```

### 10. Release docs

Add:

- `CHANGELOG-v0.2.0.md`
- `SECURITY_MODEL.md`
- `RUNBOOK.md`
- `ROLLBACK.md`
- updated `README.md`

## Stretch goals

- Mermaid architecture diagram
- Local mock webhook server for tests
- Supabase migration files instead of one schema file
- n8n workflow export/import verification notes
- API replay tests
- Telegram approval bot skeleton
- Multi-agent routing scorecard
- Evaluation harness with golden examples
