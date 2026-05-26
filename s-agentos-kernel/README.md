# S/ AgentOS Kernel v0.2.0

> **The kernel foundation of an agentic operating system.**
>
> Provider-agnostic: works with any LLM (OpenAI, Anthropic, Groq, Ollama, or custom),
> any storage (Supabase/Neon/PlanetScale/any Postgres), any notification channel
> (Telegram, Slack, WhatsApp, email, webhook).

See [ARCHITECTURE.md](ARCHITECTURE.md) for full system design and [RUNBOOK.md](RUNBOOK.md) for deployment.

## What Changed in v0.2.0

See [CHANGELOG-v0.2.0.md](CHANGELOG-v0.2.0.md) for the full diff. Highlights:

- **4 bugs fixed**: objective validation, evolve_agent route, telemetry event_name field, stale version strings
- **Provider-agnostic LLM layer**: `model_preference.provider` = auto/anthropic/groq/openai/ollama with fallback chains
- **New envelope fields**: `trace_id`, `idempotency_key`, `approval_status`, `run_mode` enum validation
- **Supabase migration**: `idempotency_keys`, `approval_requests`, `audit_log` tables
- **CI**: GitHub Actions static-qa.yml — 134 checks / 0 failures
- **New scripts**: `validate-schemas.py`, `secret-scan.py`, `workflow-lint.py`
- **New docs**: ARCHITECTURE.md, SECURITY_MODEL.md, RUNBOOK.md, ROLLBACK.md

## Quick Start

```bash
# 1. Copy env and fill in your values
cp .env.example .env && nano .env

# 2. Generate a secure operator key
bash scripts/generate-operator-key.sh

# 3. Start n8n + PostgreSQL
docker compose up -d

# 4. Apply Supabase schema (run in Supabase SQL Editor)
# supabase/schema.sql  →  base 8-table schema
# supabase/migrations/001_v0.2.0_idempotency_approval.sql  →  v0.2.0 additions

# 5. Import workflows into n8n (in order):
# workflows/s-agentos-command-gateway.json       ← import first
# workflows/s-agentos-agent-registry-service.json
# workflows/s-agentos-telemetry-logger.json
# workflows/s-agentos-evolution-planner.json

# 6. Run the test suite
export WEBHOOK_URL=https://your-n8n.domain.com/webhook/s-agentos-command
export AGENTOS_KEY=your-operator-key
bash tests/curl-tests.sh
```

## Project Structure

```
s-agentos-kernel/
├── workflows/                    # n8n workflow JSON exports (import in order)
│   ├── s-agentos-command-gateway.json          # PRIMARY: action router (v0.2.0)
│   ├── s-agentos-agent-registry-service.json
│   ├── s-agentos-telemetry-logger.json
│   └── s-agentos-evolution-planner.json
├── supabase/
│   ├── schema.sql                # Base schema (8 tables)
│   └── migrations/
│       └── 001_v0.2.0_idempotency_approval.sql
├── schemas/                      # JSON Schema definitions
│   ├── command.schema.json       # v0.2.0 command envelope (11 fields)
│   ├── agent-registry-record.schema.json
│   ├── telemetry-event.schema.json
│   └── evolution-plan.schema.json
├── openapi/
│   ├── s-agentos-kernel-v0.1.3.openapi.yaml
│   └── s-agentos-kernel-v0.2.0.openapi.yaml
├── dashboard/
│   └── index.html                # Single-file operator dashboard
├── scripts/
│   ├── static-qa.py              # 9-check QA suite
│   ├── validate-schemas.py       # Schema file validation
│   ├── secret-scan.py            # Secret pattern scanner
│   ├── workflow-lint.py          # Workflow lint (116 checks)
│   └── generate-operator-key.sh
├── tests/
│   └── curl-tests.sh             # 24-test curl suite
├── .github/workflows/
│   └── static-qa.yml             # CI: runs all QA scripts
├── ARCHITECTURE.md               # Provider-agnostic system design
├── SECURITY_MODEL.md
├── RUNBOOK.md
├── ROLLBACK.md
├── CHANGELOG-v0.2.0.md
└── .env.example
```

## Authentication

Every request needs the operator key via either header:

```http
X-AgentOS-Key: your-operator-key
```
```http
Authorization: Bearer your-operator-key
```

## Command Envelope (v0.2.0)

```json
{
  "action": "health_check",
  "objective": "Check kernel status",
  "requested_by": "operator",
  "priority": "normal",
  "run_mode": "draft",
  "approval_status": "not_required",
  "trace_id": "trace_...",
  "idempotency_key": "idem_...",
  "agent_id": null,
  "context": {},
  "metadata": {}
}
```

**Supported actions:** `health_check` | `create_agent` | `execute_task` | `evaluate_agent` | `evolve_agent` | `registry_sync` | `telemetry_log` | `list_agents` | `get_agent` | `update_agent_status`

**run_mode:** `draft` (default) | `dry_run` | `read_only` | `live` (requires `approval_status: approved`)

## LLM Provider Configuration

Set `context.model_preference` in any command:

```json
{
  "provider": "auto",
  "tier": "fast",
  "fallback": ["anthropic", "groq", "openai", "ollama"]
}
```

Set the matching env var in `.env`: `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`.

## QA Status

| Suite | Result |
|-------|--------|
| static-qa.py | 9 PASS / 0 FAIL |
| validate-schemas.py | 9 PASS / 0 FAIL |
| secret-scan.py | 0 secrets detected |
| workflow-lint.py | 116 PASS / 0 FAIL |

See [qa-validation-report.md](qa-validation-report.md) for details.
