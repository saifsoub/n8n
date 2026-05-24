# Approval Gates

## Purpose

Approval gates prevent workflows from taking sensitive external actions without explicit human approval.

## Actions that require approval

| Action | Approval required |
|---|---|
| Send external email | Yes |
| Send payment request | Yes |
| Publish public content | Yes |
| Commit client promise | Yes |
| Change pricing | Yes |
| Activate client-facing workflow | Yes |
| Share files externally | Yes |

## Approval ID Pattern

Use this format:

```txt
appr_YYYYMMDD_shortpurpose
```

Example:

```txt
appr_20260524_telegrampilot
```

## Decision States

| State | Meaning |
|---|---|
| pending | Waiting for decision |
| approved | Can proceed |
| rejected | Do not proceed |
| expired | Approval window passed |

## Operator Rule

No workflow should move from draft/preparation into external execution unless an approval record exists and the status is approved.
