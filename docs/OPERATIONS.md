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

The local Compose stack binds n8n to `127.0.0.1` by default. Use the existing
authenticated private proxy or an SSH tunnel for owner access. Changing
`N8N_BIND_ADDRESS` exposes the management port on that address; verify private
access before changing a running deployment. This configuration does not install
Tailscale or establish its access policy.

Run `bash scripts/healthcheck.sh` after startup or recovery. It checks n8n's
database readiness and exits nonzero on failure. A running container is not a
verified mission outcome. Compose waits for PostgreSQL and Redis health before
starting n8n; the restart policy handles process exits, not unhealthy-but-running
processes.

Preserve `postgres_data`, `redis_data`, `n8n_data` and the existing encryption key.
Redis still uses its existing default snapshot persistence; queue durability
needs a separate live inventory, backup and verified persistence migration.
Changing persistence settings is not an exactly-once execution guarantee.
Reconcile the canonical command, lease and effect receipt before retrying any
interrupted work. Do not remove volumes as part of recovery. This local stack has
no queue worker service; Redis availability alone does not enable queue mode.

Before production recovery, record the deployed n8n version and pin
`N8N_VERSION` to that verified version. The example's `latest` value is not a
production release selection.

```bash
docker compose -f docker-compose.local.yml restart
bash scripts/healthcheck.sh
```
