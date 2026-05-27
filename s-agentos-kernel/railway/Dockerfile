FROM docker.n8n.io/n8nio/n8n:1.84.0

# S/ AgentOS Kernel v0.2.0 — Railway deployment
# All configuration is done via environment variables.

USER root
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n
USER node

EXPOSE 5678
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD wget -qO- http://localhost:5678/healthz || exit 1
