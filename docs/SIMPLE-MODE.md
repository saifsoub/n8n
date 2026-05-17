# Simple Mode Deployment

Simple mode is the default n8n deployment - a single instance handling all operations.

## What You Get

- All-in-one n8n instance (UI + API + execution)
- PostgreSQL database
- SSL/TLS encryption

## Architecture

Single instance executes workflows directly:
```
User → n8n Instance → PostgreSQL
```

## Best For

- Personal use, testing
- Small workloads
- Small teams (1-5 users)
- Simple workflows

## Deployment

Use the Deploy-to-DO button in the README.

## Manage and Run Workflows in Browser

After deployment, open your app URL and use the n8n editor to create, modify, and execute workflows.

See [Workflow Web Runner](./WORKFLOW-RUNNER.md) for quick steps.

## Limitations

- No horizontal scaling
- All workflows execute in main process
- Limited concurrency
- Code nodes less secure (no sandboxing)

## When to Upgrade

See [SCALING.md](../SCALING.md) if you need:
- Growing workloads
- Multiple concurrent executions
- Code execution sandboxing
- High availability

## Troubleshooting

See [DEPLOY_TO_DO.md](../DEPLOY_TO_DO.md) for common issues.
