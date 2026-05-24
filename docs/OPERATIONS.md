# Operations Handbook

## Daily Checks

- Verify n8n is reachable
- Verify PostgreSQL container health
- Verify Redis container health
- Review failed executions
- Review approval queues
- Review Telegram delivery failures

## Backup

- Export workflows weekly
- Backup PostgreSQL volume
- Backup .env securely

## Governance

- Never commit secrets
- Use approval gates before external actions
- Keep workflows versioned in Git

## Recovery

```bash
docker compose -f docker-compose.local.yml restart
```
