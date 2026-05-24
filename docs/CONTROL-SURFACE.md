# Operator Control Surface

This document gives a simple operating view for the n8n repo without needing to open n8n first.

## Runtime

Start the local stack:

```bash
docker compose -f docker-compose.local.yml up -d
```

Check local health:

```bash
bash scripts/healthcheck.sh
```

Open n8n:

```txt
http://localhost:5678
```

## Current Operating Assets

| Asset | Path | Purpose |
|---|---|---|
| Local runtime | `docker-compose.local.yml` | Runs n8n, PostgreSQL, and Redis |
| Environment template | `.env.example` | Shows required local settings |
| Workflow registry | `docs/WORKFLOW-REGISTRY.md` | Lists active and template workflows |
| Operations handbook | `docs/OPERATIONS.md` | Daily checks, backup, governance, recovery |
| Healthcheck | `scripts/healthcheck.sh` | Checks runtime status |
| Import helper | `scripts/import-workflows.sh` | Validates workflow JSON files |

## Workflow Queue

| Workflow | File | Status |
|---|---|---|
| Telegram approval | `workflows/telegram-approval.json` | Active foundation |
| AI router | `workflows/ai-router-template.json` | Template |
| Monday sync | `workflows/monday-sync-template.json` | Template |
| Gmail approval | `workflows/gmail-approval-template.json` | Template |

## Operator Rules

- Do not commit real secrets.
- Keep `.env` local only.
- Import workflows only after JSON validation passes.
- Any external email, payment, publishing, or client commitment requires an explicit approval gate.
- Keep workflow files in Git so changes are reviewable.

## Next Build Targets

1. Approval callback logging.
2. Workflow execution dashboard.
3. Workflow backup automation.
4. n8n API import mode.
5. Agent handoff checklist.
