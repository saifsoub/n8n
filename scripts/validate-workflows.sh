#!/usr/bin/env bash
set -euo pipefail

find workflows -name '*.json' -print0 | while IFS= read -r -d '' file; do
  jq empty "$file"
  echo "Validated: $file"
done
