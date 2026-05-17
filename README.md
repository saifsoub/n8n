# n8n on DigitalOcean App Platform

Deploy the powerful workflow automation platform [n8n](https://n8n.io) to DigitalOcean App Platform.

## Choose Your Deployment Tier

### 🚀 Simple Mode (Recommended Start)

**Best for:** Personal use, testing, small workloads

- ✅ One-click deployment
- ✅ Single instance (UI + API + execution)
- ✅ PostgreSQL database
- ✅ SSL/TLS included

**Prerequisites: (⚠️ MUST DO)**
- Generate n8n encryption key: `openssl rand -base64 32`. Replace `N8N_ENCRYPTION_KEY` env variable in template(doctl) or app(UI)

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/AppPlatform-Templates/n8n-appplatform/tree/main)

[📖 Simple Mode Guide](docs/SIMPLE-MODE.md) | [📄 Spec](.do/examples/starter.yaml)

---

### ⚡ Queue Mode (Production Ready)

**Best for:** Teams, scalability, growing workloads

- 🔄 Main + Worker architecture
- 🔴 Redis job queue
- 📈 Horizontal scaling (add workers)
- 💪 PostgreSQL + Redis databases

**Prerequisites: (⚠️ MUST DO)**
- Generate n8n encryption key: `openssl rand -base64 32`. Replace `N8N_ENCRYPTION_KEY` env variable in template(doctl) or app(UI)
- Create PostgreSQL: `doctl databases create n8n-postgres --engine pg --version 17 --region <region> --size db-s-1vcpu-2gb`
- Create Redis: `doctl databases create n8n-redis --engine valkey --version 8 --region <region> --size db-s-1vcpu-1gb`

[📖 Deploy Queue Mode](docs/QUEUE-MODE.md) | [📄 Spec](.do/examples/queue-mode.yaml)

---

### 🔒 With Task Runners

**Best for:** JavaScript/Python code execution, security

- 🏃 Code execution in sandbox
- 🛡️ Secure isolation for Code nodes
- ⚙️ Single instance + runners

**Prerequisites: (⚠️ MUST DO)**
- Generate n8n encryption key: `openssl rand -base64 32`. Replace `N8N_ENCRYPTION_KEY` env variable in template(doctl) or app(UI)
- Generate n8n runner token: `openssl rand -base64 32`. Replace `N8N_RUNNERS_AUTH_TOKEN` env variable in template(doctl) or app(UI)
- Create PostgreSQL: `doctl databases create n8n-postgres --engine pg --version 17 --region <region> --size db-s-1vcpu-2gb`

[📖 Deploy With Runners](docs/WITH-RUNNERS.md) | [📄 Spec](.do/examples/with-runners.yaml)

---

### 🏢 Production (Enterprise Scale)

**Best for:** Enterprise workloads, code-heavy, HA

- 🎯 Queue + Workers + Runners
- 📊 Auto-scaling capable
- 🔄 High availability
- 💪 Full production stack

**Prerequisites: (⚠️ MUST DO)**
- Generate n8n encryption key: `openssl rand -base64 32`. Replace `N8N_ENCRYPTION_KEY` env variable in template(doctl) or app(UI)
- Generate n8n runner token: `openssl rand -base64 32`. Replace `N8N_RUNNERS_AUTH_TOKEN` env variable in template(doctl) or app(UI)
- Create PostgreSQL: `doctl databases create n8n-postgres --engine pg --version 17 --region <region> --size db-s-1vcpu-2gb`
- Create Redis: `doctl databases create n8n-redis --engine valkey --version 8 --region <region> --size db-s-1vcpu-1gb`

[📖 Deploy Production](docs/PRODUCTION-SETUP.md) | [📄 Spec](.do/examples/production.yaml)

---

## Pricing

For detailed pricing information based on instance sizes and resources, visit the [DigitalOcean App Platform Pricing](https://www.digitalocean.com/pricing/app-platform) page.

---

## Deployment Method

### Simple Mode (Deploy Button)
1. Click "Deploy to DO" button above
2. Generate encryption key: `openssl rand -base64 32`
3. Replace `N8N_ENCRYPTION_KEY` in app env variables
4. Click "Create App", wait for app to deploy
5. Access at your app URL

### Deploy via CLI
```bash
# Simple/Starter Mode
doctl apps create --spec .do/app.yaml

# Queue/Scaling Mode
doctl apps create --spec .do/examples/queue-mode.yaml

# With Runners
doctl apps create --spec .do/examples/with-runners.yaml

# Production
doctl apps create --spec .do/examples/production.yaml
```

**To customize**: Fork this repo, update the repo reference in your chosen template (`.do/` folder) to point to your fork, then deploy.

**Need help deciding?** See [SCALING.md](SCALING.md)

---

## Version Strategy

We use a tiered versioning approach to balance ease of use with production stability:

### 📌 Pinned Versions (Production Templates)
- **Queue Mode**, **With Runners**, **Production** templates use pinned versions (e.g., `2.3.2`)

### 🔄 Latest Version (Starter Templates)
- **Starter Mode** templates use `latest` tag

**Production tip**: Always pin to a specific version (e.g., `2.3.2`) instead of using `latest` for predictable deployments.

---

### ⚠️ Production Storage Consideration

**Important for Production Deployments:**

App Platform uses **ephemeral storage** - files are lost on container restart. For production use:

- **✅ Database** stores: workflows, credentials, execution history (persistent)
- **❌ Container** stores: binary files, custom nodes, uploads (ephemeral)

**Recommendation**: Configure [DigitalOcean Spaces](PRODUCTION.md#-persistent-storage-critical-for-production) ($5/month) for persistent file storage if:
- Workflows handle file uploads/downloads
- Using custom community nodes
- Processing binary data (images, PDFs, etc.)

**Quick Setup** (5 minutes):
1. Create a Space via [DigitalOcean Control Panel](https://cloud.digitalocean.com/spaces)
2. Generate access keys: `doctl spaces keys create n8n-storage-key`
3. Add credentials to your app spec - see PRODUCTION.md for full config

📖 **Full guide**: [Persistent Storage Setup](PRODUCTION.md#-persistent-storage-critical-for-production)

---

## What is n8n?

n8n is a **fair-code licensed workflow automation tool** - an open-source alternative to Zapier that you can self-host.

- 🔌 400+ integrations (Google, Slack, GitHub, etc.)
- 🎨 Visual workflow builder
- 🤖 AI capabilities with LangChain
- 🔐 Self-hosted - you own your data
- 💰 Free for personal use

## Documentation

### Getting Started
- **[Deployment Guide](DEPLOY_TO_DO.md)** - Step-by-step deployment
- **[Environment Variables](ENV_TEMPLATE.md)** - Configuration reference

### Scaling & Production
- **[Scaling Guide](SCALING.md)** - When and how to scale
- **[Production Setup](PRODUCTION.md)** - Security & best practices
- **[Version Info](VERSION.md)** - Updates & versioning

### Mode-Specific Guides
- **[Simple Mode](docs/SIMPLE-MODE.md)** - Default deployment
- **[Queue Mode](docs/QUEUE-MODE.md)** - Scalable architecture
- **[With Runners](docs/WITH-RUNNERS.md)** - Sandboxed code execution
- **[Production Setup](docs/PRODUCTION-SETUP.md)** - Enterprise deployment

## What's Included

- n8n v2.3.2 (production templates) / latest (starter templates)
- PostgreSQL 17 database (persistent storage)
- SSL/TLS encryption
- Automated backups
- Health monitoring
- Optional: Spaces for persistent file storage ($5/month)

## Example Use Cases

- Automate repetitive tasks
- Sync data between apps
- Build custom API integrations
- Schedule automated reports
- Create webhook listeners
- Build AI-powered workflows

## Support

- **n8n Docs**: [docs.n8n.io](https://docs.n8n.io)
- **Community**: [community.n8n.io](https://community.n8n.io)
- **Templates**: [n8n.io/workflows](https://n8n.io/workflows)
- **Issues**: [GitHub](https://github.com/AppPlatform-Templates/n8n-appplatform/issues)

---

**Ready to automate?** Choose your tier above and start building workflows! 🚀
