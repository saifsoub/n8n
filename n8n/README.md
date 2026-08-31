# Assistant Hub n8n workflows

## Hourly follow-up engine

Import `workflows/assistant-control-hourly-follow-up.json` into n8n, replace the
placeholder Google Sheets credential, and provide these worker-runtime variables:

| Variable | Purpose |
| --- | --- |
| `ASSISTANT_CONTROL_SHEET_ID` | ID of `S/ Live Command Sheet — Projects & Hourly Activity` |
| `ASSISTANT_WORKER_ROUTER_URL` | Internal S/PM endpoint that accepts assigned work |
| `ASSISTANT_WORKER_ROUTER_TOKEN` | Bearer token for the internal worker endpoint |
| `ASSISTANT_SEIF_ESCALATION_URL` | Decision-only notification endpoint |

The source workbook must contain `Assistant Control` and `Assistant Activity` tabs.
The control tab uses `Task ID`, `Status`, `Has Value`, `Next Action`, `Authorized`,
`Execution Owner`, `Sensitive Permission`, `New Cost`, `Owner Judgment`, and
`Outcome Decision Required`. Boolean cells accept yes/no, true/false, 1/0, or
approved. Missing owners on valuable work are assigned to `S/PM Orchestration`.
An empty next action is held silently rather than treated as a decision escalation;
set `Outcome Decision Required` only when Seif must choose an outcome.

The workflow is deliberately inactive in source control. After credential binding,
activate it in n8n; the **Every Hour** schedule then runs once per hour. Successful
and failed executions are retained by the workflow settings. Each processed row
also appends a redacted audit record (run ID, task ID, disposition, owner, reason,
delivery outcome, and n8n execution URL) to `Assistant Activity`; secrets and task payloads are not
written there. It then updates the matching `Task ID` in `Assistant Control` with
the assigned owner, last follow-up time, disposition, and evidence link. Add those
four output columns to the control tab before activation.

### Routing policy

1. No-value, obsolete, or cancelled work is archived.
2. Sensitive permissions, new costs, outcome-changing decisions, and final
   owner-only judgment/submission are escalated to Seif.
3. A clear, authorized next action is posted to its execution owner through the
   worker router.
4. Everything else remains silent and is revisited on the next hourly pass.

### Production acceptance runbook

Configuration or fixture output is **not** production acceptance evidence. Run
**Manual Evidence Run** against the live sheet after activating the imported
workflow, using four redacted rows: an authorized worker action, an ordinary
pending/no-escalation action, a decision-required action, and an obsolete action.
Confirm the worker received the first item, only the decision item reached Seif,
and all four `Assistant Activity` records link to retained n8n executions. Confirm
the workflow wrote those links into the corresponding `Assistant Control` evidence
cells. Do not close the issue until this live run is complete.
