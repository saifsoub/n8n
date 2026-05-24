#!/usr/bin/env bash
set -euo pipefail

if grep -R --line-number --exclude-dir=.git --exclude='.env.example' 'replace_with_' .; then
  echo 'Placeholder values detected. Replace before production deployment.'
else
  echo 'No placeholder secrets detected.'
fi
