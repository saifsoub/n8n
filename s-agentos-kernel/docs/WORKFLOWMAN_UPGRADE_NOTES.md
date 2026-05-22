# Workflow Man Upgrade Notes — S/ AgentOS Kernel v0.1.3

This package is a cleaned and merged upgrade based on Kimi's kernel ZIP plus the previous S/ AgentOS implementation pack.

## What Kimi's upgrade added

- Supabase/PostgreSQL operating-memory schema.
- n8n command gateway workflow.
- n8n agent registry service workflow.
- n8n telemetry logger workflow.
- n8n evolution planner workflow.
- Browser command-control dashboard.
- Docker Compose deployment for n8n + PostgreSQL.
- Curl test suite.

## What Workflow Man patched

1. **Command gateway auth fixed**
   - The gateway now validates against `S_AGENTOS_OPERATOR_KEY`.
   - `S_AGENTOS_API_TOKEN` remains supported only as a compatibility alias.

2. **Command gateway body propagation fixed**
   - The auth node now preserves the original webhook `body` and `headers`.

3. **Auth header support normalized**
   - All workflows now accept either:
     - `X-AgentOS-Key: <operator-key>`
     - `Authorization: Bearer <operator-key>`

4. **Docker Compose runtime env fixed**
   - `S_AGENTOS_OPERATOR_KEY`, kernel version, Supabase values, and optional LLM provider keys are now passed into the n8n container.

5. **Priority enum expanded**
   - The command gateway now accepts `low`, `normal`, `medium`, `high`, `urgent`, and `critical`.

6. **Version alignment**
   - README, dashboard, environment file, schema defaults, and workflow hardcoded kernel versions are aligned to `v0.1.3`.

7. **GPT Actions contract added**
   - Added `openapi/s-agentos-kernel-v0.1.3.openapi.yaml`.

8. **Machine-readable schemas added**
   - Added JSON schemas for commands, agent registry records, telemetry events, and evolution plans.

9. **Static QA regenerated**
   - The stale Kimi QA report was replaced with a current validation report for this patched package.

## Recommended import order

1. Run `supabase/schema.sql` in Supabase.
2. Deploy Docker Compose.
3. Create n8n Supabase credentials named `Supabase API`.
4. Import and activate:
   - `workflows/s-agentos-telemetry-logger.json`
   - `workflows/s-agentos-evolution-planner.json`
   - `workflows/s-agentos-agent-registry-service.json`
   - `workflows/s-agentos-command-gateway.json`
5. Run `tests/curl-tests.sh`.
6. Configure GPT Actions using the OpenAPI file.
