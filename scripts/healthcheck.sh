#!/usr/bin/env bash
set -euo pipefail

N8N_URL="${N8N_URL:-http://localhost:5678}"

echo "Checking n8n: $N8N_URL"
if curl -fsS "$N8N_URL/healthz" >/dev/null 2>&1; then
  echo "n8n health endpoint is OK"
else
  echo "n8n health endpoint did not respond. Try opening $N8N_URL or check docker logs."
fi

echo "Containers:"
docker compose -f docker-compose.local.yml ps
