# n8n Workflow Web Runner

Use the n8n web app to add, modify, and run workflows from your browser.

## Open the Web UI

1. Deploy using one of the templates in this repository.
2. Open your app URL (for example `https://your-app-name.ondigitalocean.app`).
3. Complete first-user setup (owner email, name, and password).

## Add a Workflow

1. Click **New Workflow**.
2. Add nodes from the node panel.
3. Connect nodes and configure credentials/parameters.
4. Click **Save**.

## Modify a Workflow

1. Open the workflow from the left-side workflow list.
2. Update nodes, triggers, credentials, or settings.
3. Click **Save** again.

## Run a Workflow

- **Manual run:** Click **Execute workflow** in the editor.
- **Automatic run:** Toggle **Active** to run from trigger events (Webhook, Cron, etc.).

## Import or Export Workflows

- **Import:** `...` menu → **Import from file** (or paste JSON).
- **Export:** `...` menu → **Download** to JSON.

This lets you move workflows between environments and keep backups.
