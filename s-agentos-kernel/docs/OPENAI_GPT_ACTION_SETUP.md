# GPT Actions Setup

Use this file for S/ Operations GPT.

## OpenAPI file

```text
openapi/s-agentos-kernel-v0.1.3.openapi.yaml
```

## Server URL

Replace `https://YOUR_N8N_PUBLIC_DOMAIN` with your public n8n domain.

Example:

```text
https://agentos.example.com
```

The command path is:

```text
/webhook/s-agentos-command
```

## Authentication

Preferred:

```http
X-AgentOS-Key: <S_AGENTOS_OPERATOR_KEY>
```

Alternative:

```http
Authorization: Bearer <S_AGENTOS_OPERATOR_KEY>
```

## Suggested GPT behavior

- Use `health_check` before first operational command.
- Use `run_mode: draft` unless the user explicitly asks to execute.
- Use `create_agent` when a repeated domain or task stream deserves its own agent.
- Use `evaluate_agent` before `evolve_agent`.
- Use `telemetry_log` for non-critical observations.
- Escalate to the user before destructive actions, credential changes, deployments, payments, or production mutations.
