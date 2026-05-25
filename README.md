# S/ n8n Operating Stack

[![Stack](https://img.shields.io/badge/part%20of-S%2F%20Operator%20Stack-0f766e)](docs/ECOSYSTEM.md)
[![Pairs with](https://img.shields.io/badge/control%20plane-S--OS-blue)](https://github.com/saifsoub/S-OS)
[![Cockpit](https://img.shields.io/badge/cockpit-AgentEmpire-purple)](https://github.com/saifsoub/AgentEmpire)

Local-first **automation runtime** for S/ and DoneAi: Docker, Postgres, Redis, workflow JSON, and CI validation.

Part of the **S/ Operator Stack** — see [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md):

| Repo | Role |
|------|------|
| [S-OS](https://github.com/saifsoub/S-OS) | AgentOS control plane (gateway, registry, schemas) |
| **n8n** (this repo) | Workflow engine + ops runbooks |
| [AgentEmpire](https://github.com/saifsoub/AgentEmpire) | Operator dashboard UI |

Import kernel workflows from **S-OS** into this n8n instance after the stack is up.

---

A practical local-first n8n operating repository for:

- Telegram approval workflows
- Revenue operations
- AI automation pipelines
- Persistent PostgreSQL-backed workflows
- Redis queue execution
- Docker-based deployment
- GitHub CI validation

---

## Quick Start

### 1. Copy environment template

```bash
cp .env.example .env
```

### 2. Generate encryption key

```bash
openssl rand -base64 32
```

Replace `N8N_ENCRYPTION_KEY` inside `.env`.

### 3. Start stack

```bash
docker compose -f docker-compose.local.yml up -d
```

### 4. Open n8n

```txt
http://localhost:5678
```

---

## Included

### Infrastructure

- n8n
- PostgreSQL
- Redis
- Docker local stack
- GitHub validation CI

### Workflow Assets

- Telegram approval workflow
- Workflow import/export directory
- Persistent workflow volume

### Governance

- JSON validation in CI
- Docker compose validation
- Environment template
- Local-first execution

---

## Operator Layer

See:

```txt
docs/CONTROL-SURFACE.md
```

This gives operators and agents a lightweight operational overview without opening n8n first.

---

## Repo Structure

```txt
.github/workflows/       CI validation
workflows/               n8n workflow JSON files
scripts/                 runtime and validation helpers
docs/                    operations and governance
.env.example             environment template
docker-compose.local.yml local runtime stack
```

---

## Telegram Approval Workflow

Included:

```txt
workflows/telegram-approval.json
```

Capabilities:

- Telegram trigger
- Inline approval buttons
- Approval/reject callbacks
- Foundation for agent approvals

---

## Production Notes

Recommended runtime order:

1. Local Docker
2. VPS or Coolify
3. Railway / Render / Fly.io
4. Kubernetes only when scale actually requires it

Avoid unnecessary recurring infrastructure costs during early operations.

---

## Validation

GitHub Actions validates:

- Workflow JSON syntax
- Docker compose structure

Workflow file:

```txt
.github/workflows/validate.yml
```

---

## Next Recommended Extensions

- Monday.com integration
- Gmail approval flows
- AI routing agent
- Telegram mini app
- Revenue dashboard
- Workflow execution analytics
- Human approval gates
- Queue workers
- External webhook registry

---

## Philosophy

This repository is designed for:

- operational truth
- low-friction deployment
- real workflow execution
- persistent automation
- zero-fluff infrastructure
