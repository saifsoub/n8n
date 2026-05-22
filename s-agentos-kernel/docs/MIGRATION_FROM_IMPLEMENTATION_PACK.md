# Migration from the Previous S/ AgentOS Implementation Pack

The original implementation pack was a useful design scaffold. Kimi's upgrade moves the project closer to a runnable kernel.

## Use from Kimi/Workflow Man v0.1.3

- Supabase schema instead of the earlier SQLite/S-Drive schema for operating memory.
- n8n production workflows in `workflows/`.
- Dashboard in `dashboard/index.html`.
- Curl tests in `tests/curl-tests.sh`.
- GPT Actions contract in `openapi/`.

## Keep conceptually from the original pack

- Agent lifecycle model.
- Meta-orchestrator prompt logic.
- Dry-run-first governance.
- Security posture around token rotation and least privilege.

## Do not import both workflow sets at the same time

The old pack's n8n workflows used different routes and storage assumptions. Use the patched kernel workflows as the active system, and keep the old pack only as reference.
