# Claude Output Contract

Claude should return a release candidate response with this structure.

## 1. Executive summary

- What was changed
- Why it matters
- What remains risky

## 2. Audit findings

Table:

| Severity | Area | Finding | Fix |
|---|---|---|---|

## 3. Files changed

Table:

| File | Change type | Purpose |
|---|---|---|

## 4. Patch or full files

Provide either:

- complete updated files, or
- unified diffs, or
- a ZIP containing the updated repository.

## 5. QA report

Include:

```text
PASS/FAIL summary
Commands run
Known limitations
```

## 6. Deployment runbook

Include copy-paste commands:

```bash
cp .env.example .env
# edit .env safely
docker compose up -d
python3 scripts/static-qa.py
bash tests/curl-tests.sh
```

## 7. Rollback plan

Include:

- workflow rollback
- database rollback
- Docker rollback
- operator-key rotation
- emergency disable steps

## 8. Next roadmap

Split into:

- v0.2.1 hotfixes
- v0.3.0 features
- production go-live checklist
