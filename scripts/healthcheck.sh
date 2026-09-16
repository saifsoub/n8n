#!/usr/bin/env bash
set -euo pipefail

N8N_URL="${N8N_URL:-http://localhost:5678}"
N8N_URL="${N8N_URL%/}"
STACK_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Checking n8n database readiness"
if curl -fsS --connect-timeout 5 --max-time 15 "$N8N_URL/healthz/readiness" >/dev/null 2>&1; then
  echo "n8n readiness endpoint is OK"
else
  echo "n8n is not ready. Inspect the application and database logs." >&2
  docker compose -f "$STACK_ROOT/docker-compose.local.yml" ps >&2 || true
  exit 1
fi

echo "Containers:"
docker compose -f "$STACK_ROOT/docker-compose.local.yml" ps
