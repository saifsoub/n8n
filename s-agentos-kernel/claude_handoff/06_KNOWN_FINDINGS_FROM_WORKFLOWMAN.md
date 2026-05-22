# Known Findings from WorkflowMan Before Claude Review

These are not final audit results. They are starting points for Claude to verify.

## High priority

1. **Live validation gap**
   - Static QA passed, but there is no proof the workflows import and run correctly in a live n8n + Supabase environment.

2. **Version drift likely remains**
   - README appears to reference `v0.1.3.3`.
   - `.env.example` header appears to reference `v0.1`.
   - Package filename references `v0.1.3`.

3. **No robust idempotency layer**
   - Duplicate webhook calls could potentially trigger duplicate downstream actions unless n8n/Supabase workflows enforce idempotency.

4. **No replay protection**
   - Operator-key auth is useful but does not stop captured request replay unless timestamp/HMAC validation is added.

5. **Approval gates need formalization**
   - Live/consequential actions should require explicit approval before execution.

6. **Dashboard security should be reviewed**
   - Ensure no service-role keys, operator keys, or live secrets are embedded or stored unsafely.

7. **Supabase security needs review**
   - Validate RLS/policy choices and service-role usage patterns.

## Medium priority

8. **OpenAPI/schema/workflow alignment**
   - The command payload model should be made canonical across every layer.

9. **Error telemetry**
   - Every failure path should emit a telemetry event with trace ID and sanitized error.

10. **CI missing or incomplete**
   - Add GitHub Actions static QA.

11. **Secret scanner missing**
   - Add a local script to prevent accidental key leakage.

12. **Rollback process unclear**
   - Add a documented rollback flow for workflow imports, schema migrations, and Docker Compose.

## Product/architecture opportunities

13. **Approval queue**
   - Add an approval workflow/table that can later be connected to Telegram.

14. **Agent lifecycle governance**
   - Add statuses and transitions: draft → active → paused → retired.

15. **Evaluation harness**
   - Add golden tasks/eval criteria so agents can be scored repeatedly.

16. **Operational dashboard**
   - Add clear status cards: kernel health, recent commands, active agents, pending approvals, errors.
