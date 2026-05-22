# First-Run Deployment — S/ AgentOS Kernel v0.1.3

## 0. Security first

Rotate any token or API key that has ever appeared in a browser tab, screenshot, chat, terminal output, or shared file. Start with:

- Telegram bot tokens
- Groq keys
- Supabase service-role keys
- n8n credentials
- Any local bridge or S/Drive token

## 1. Prepare environment

```bash
cp .env.example .env
openssl rand -base64 32
openssl rand -base64 24
```

Use the first generated value for:

```bash
S_AGENTOS_OPERATOR_KEY=<generated-operator-key>
S_AGENTOS_API_TOKEN=<same-generated-operator-key>
```

Use the second generated value for:

```bash
N8N_ENCRYPTION_KEY=<generated-n8n-encryption-key>
```

## 2. Start n8n

```bash
docker compose up -d
docker compose ps
docker compose logs --tail 100 n8n
```

## 3. Prepare Supabase

Open Supabase SQL Editor and execute:

```text
supabase/schema.sql
```

Then in n8n, create a credential named exactly:

```text
Supabase API
```

Use your Supabase project URL and service-role key. Never expose the service-role key to the dashboard or frontend.

## 4. Import workflows

Import these files into n8n:

```text
workflows/s-agentos-telemetry-logger.json
workflows/s-agentos-evolution-planner.json
workflows/s-agentos-agent-registry-service.json
workflows/s-agentos-command-gateway.json
```

Activate all workflows.

## 5. Test gateway

```bash
export WEBHOOK_URL="https://YOUR_DOMAIN/webhook/s-agentos-command"
export REGISTRY_URL="https://YOUR_DOMAIN/webhook/s-agentos-registry"
export TELEMETRY_URL="https://YOUR_DOMAIN/webhook/s-agentos-telemetry"
export EVOLUTION_URL="https://YOUR_DOMAIN/webhook/s-agentos-evolution"
export AGENTOS_KEY="<same-as-S_AGENTOS_OPERATOR_KEY>"

bash tests/curl-tests.sh
```

## 6. Launch dashboard

Serve the dashboard over HTTP rather than opening it as a local file:

```bash
cd dashboard
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

Set:

```text
n8n Webhook URL = https://YOUR_DOMAIN/webhook/s-agentos-command
Operator Key = <S_AGENTOS_OPERATOR_KEY>
```

## 7. Connect GPT Actions

Use:

```text
openapi/s-agentos-kernel-v0.1.3.openapi.yaml
```

Authentication can be configured as either:

```http
X-AgentOS-Key: <operator-key>
```

or:

```http
Authorization: Bearer <operator-key>
```

For least confusion, use `X-AgentOS-Key` wherever the UI allows a custom API key header.
