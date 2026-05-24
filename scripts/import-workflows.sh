#!/usr/bin/env bash
set -euo pipefail

N8N_URL="${N8N_URL:-http://localhost:5678}"
WORKFLOW_DIR="${WORKFLOW_DIR:-workflows}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required"
  exit 1
fi

if [ ! -d "$WORKFLOW_DIR" ]; then
  echo "No workflow directory found: $WORKFLOW_DIR"
  exit 0
fi

find "$WORKFLOW_DIR" -name '*.json' -print0 | while IFS= read -r -d '' file; do
  jq empty "$file"
  echo "Validated workflow: $file"
done

echo "Workflow files validated. Import through n8n UI or extend this script with your n8n API key."
