# n8n Import Order

Use this order for the patched S/ AgentOS Kernel v0.1.3.

## Required

1. `workflows/s-agentos-telemetry-logger.json`
2. `workflows/s-agentos-evolution-planner.json`
3. `workflows/s-agentos-agent-registry-service.json`
4. `workflows/s-agentos-command-gateway.json`

## Why this order

The command gateway is the main operator interface. The other workflows are supporting services and should be activated first.

## Required n8n credential

Create this credential before activating workflows:

```text
Supabase API
```

All Supabase nodes reference this credential name. After import, open each workflow and confirm the Supabase nodes are mapped to the credential.

## Required environment variables inside n8n container

The patched `docker-compose.yml` passes these into n8n:

```text
S_AGENTOS_KERNEL_VERSION
S_AGENTOS_OPERATOR_KEY
S_AGENTOS_API_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
GROQ_API_KEY
```

The auth code needs `S_AGENTOS_OPERATOR_KEY`.
