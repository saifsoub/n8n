# Runtime Runbook

## Start

cp .env.example .env
make start

## Check

make health
make validate

## Open

http://localhost:5678

## Import workflows

Import JSON files from the workflows folder inside the n8n UI.

## Acceptance criteria

- Docker stack starts.
- n8n opens locally.
- PostgreSQL persists data.
- Redis starts.
- Workflow JSON validates.
- Compose config validates.
- Local secrets stay outside Git.
- Telegram variables are defined locally.
- Approval workflow imports into n8n.
- External actions remain behind approval gates.

## Operating path

1. Start stack.
2. Validate files.
3. Import workflows.
4. Configure credentials inside n8n.
5. Activate trigger workflows.
6. Test Telegram message.
7. Check execution history.
8. Review approval gates before external action.
