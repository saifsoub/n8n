# n8n Version Information

## Current Versions

This repository uses a tiered versioning approach:

- **Production templates** (Queue Mode, With Runners, Production): **n8n v2.3.2** (pinned)
- **Starter templates** (Simple Mode): **latest** tag (auto-updates to newest stable release)

## Version Source

The version was determined by checking the GitHub releases API:
```bash
gh repo view n8n-io/n8n --json latestRelease --jq '.latestRelease.tagName'
```

## Update Policy

### How to Check for Updates

1. Visit the [n8n releases page](https://github.com/n8n-io/n8n/releases)
2. Or use the GitHub CLI:
   ```bash
   gh repo view n8n-io/n8n --json latestRelease
   ```

### How to Update

To update this deployment to a newer version of n8n:

1. **Check the latest release** on [n8n releases](https://github.com/n8n-io/n8n/releases)
2. **Review the [release notes](https://docs.n8n.io/release-notes/)** for breaking changes
3. **Update the version** in your app spec file:
   - For pinned versions: Change `tag: "2.3.2"` to the new version
   - For latest: No change needed (auto-updates)
4. **Redeploy** to App Platform:
   ```bash
   doctl apps update YOUR_APP_ID --spec path/to/spec.yaml
   ```

## Deployment Information

- **Deployed on**: DigitalOcean App Platform
- **Region**: Amsterdam (ams3)
- **Database**: PostgreSQL 17
- **Instance Size**: apps-s-1vcpu-1gb (1 vCPU, 1 GB RAM)

## Upstream Repository

- **Source**: https://github.com/n8n-io/n8n
- **Documentation**: https://docs.n8n.io
- **License**: Sustainable Use License (Fair-code)
