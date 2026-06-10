// S/ AgentOS Kernel v0.2.0 — Cloudflare Worker
// Command gateway — writes directly to Supabase via REST API.
// Deploy: npx wrangler deploy
// Secrets: npx wrangler secret put S_AGENTOS_OPERATOR_KEY
//          npx wrangler secret put SUPABASE_URL
//          npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

const KERNEL_VERSION = "0.2.0";

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ── Auth ─────────────────────────────────────────────────────────────────────

function extractKey(request) {
  const bearer = (request.headers.get("authorization") || "").trim();
  if (bearer.startsWith("Bearer ")) return bearer.slice(7).trim();
  return (request.headers.get("x-agentos-key") || "").trim();
}

function isAuthorized(request, env) {
  const expected = (env.S_AGENTOS_OPERATOR_KEY || "").trim();
  return expected.length > 0 && extractKey(request) === expected;
}

// ── Supabase REST client ──────────────────────────────────────────────────────

function makeDb(env) {
  const base = (env.SUPABASE_URL || "").replace(/\/$/, "");
  const key  = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const h    = {
    apikey:         key,
    Authorization:  `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer:         "return=representation",
  };

  async function req(path, method, body, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${base}/rest/v1/${path}${qs ? "?" + qs : ""}`;
    const r = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(`Supabase ${method} /${path} → ${r.status}: ${await r.text()}`);
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  }

  return {
    insert: (table, record)            => req(table, "POST",  record),
    select: (table, query, filters)    => req(table, "GET",   null,   { select: query || "*", ...filters }),
    update: (table, patch,  filters)   => req(table, "PATCH", patch,  filters),
  };
}

// ── Normalize inbound command ─────────────────────────────────────────────────

function normalize(raw) {
  return {
    command_id:      raw.command_id      || crypto.randomUUID(),
    trace_id:        raw.trace_id        || crypto.randomUUID(),
    idempotency_key: raw.idempotency_key || crypto.randomUUID(),
    action:          raw.action          || "unknown",
    objective:       raw.objective       || "",
    requested_by:    raw.requested_by    || "operator",
    priority:        raw.priority        || "normal",
    run_mode:        raw.run_mode        || "dry_run",
    approval_status: raw.approval_status || "pending",
    agent_id:        raw.agent_id        || null,
    context:         raw.context         || {},
    metadata:        raw.metadata        || {},
  };
}

// ── Action handlers ───────────────────────────────────────────────────────────

async function dispatch(cmd, db) {
  switch (cmd.action) {

    case "health_check":
      return { ok: true, kernel_version: KERNEL_VERSION, timestamp: new Date().toISOString() };

    case "register_agent": {
      const id = cmd.agent_id || crypto.randomUUID();
      const rec = {
        agent_id:         id,
        agent_name:       cmd.context.agent_name  || `agent-${id.slice(0, 8)}`,
        agent_type:       cmd.context.agent_type  || "generic",
        owner:            cmd.requested_by,
        lifecycle_status: "active",
        capabilities:     cmd.context.capabilities || [],
        config:           cmd.context.config       || {},
        metadata:         cmd.metadata,
        kernel_version:   KERNEL_VERSION,
      };
      const rows = await db.insert("agent_registry", rec);
      return { ok: true, agent_id: id, record: rows?.[0] || rec };
    }

    case "update_agent": {
      if (!cmd.agent_id) throw new Error("agent_id required");
      const patch = { updated_at: new Date().toISOString(), ...cmd.context };
      const rows = await db.update("agent_registry", patch, { "agent_id": `eq.${cmd.agent_id}` });
      return { ok: true, record: rows?.[0] || patch };
    }

    case "deactivate_agent": {
      if (!cmd.agent_id) throw new Error("agent_id required");
      const rows = await db.update("agent_registry",
        { lifecycle_status: cmd.context.new_status || "inactive", updated_at: new Date().toISOString() },
        { "agent_id": `eq.${cmd.agent_id}` }
      );
      return { ok: true, record: rows?.[0] };
    }

    case "list_agents": {
      const filters = {};
      if (cmd.context.lifecycle_status) filters["lifecycle_status"] = `eq.${cmd.context.lifecycle_status}`;
      const rows = await db.select("agent_registry", "*", filters);
      return { ok: true, agents: rows, count: rows.length };
    }

    case "get_agent": {
      if (!cmd.agent_id) throw new Error("agent_id required");
      const rows = await db.select("agent_registry", "*", { "agent_id": `eq.${cmd.agent_id}` });
      return { ok: true, agent: rows?.[0] || null };
    }

    case "log_event": {
      const rec = {
        event_id:       crypto.randomUUID(),
        command_id:     cmd.command_id,
        agent_id:       cmd.agent_id,
        event_type:     cmd.context.event_type || "generic",
        payload:        cmd.context.payload    || cmd.context,
        kernel_version: KERNEL_VERSION,
      };
      const rows = await db.insert("os_events", rec);
      return { ok: true, event_id: rec.event_id, record: rows?.[0] || rec };
    }

    case "get_status": {
      const filters = cmd.command_id ? { "command_id": `eq.${cmd.command_id}` } : {};
      const rows = await db.select("os_commands", "*", filters);
      return { ok: true, commands: rows, count: rows.length };
    }

    case "request_approval": {
      const rec = {
        request_id:      crypto.randomUUID(),
        command_id:      cmd.command_id,
        requested_by:    cmd.requested_by,
        approval_status: "pending",
        notes:           cmd.context.notes || "",
      };
      const rows = await db.insert("approval_requests", rec);
      return { ok: true, request_id: rec.request_id, record: rows?.[0] || rec };
    }

    case "list_commands": {
      const filters = {};
      if (cmd.context.action)          filters["action"]          = `eq.${cmd.context.action}`;
      if (cmd.context.approval_status) filters["approval_status"] = `eq.${cmd.context.approval_status}`;
      const rows = await db.select("os_commands", "*", filters);
      return { ok: true, commands: rows, count: rows.length };
    }

    default:
      throw new Error(`Unknown action: ${cmd.action}`);
  }
}

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-AgentOS-Key",
        },
      });
    }

    if (url.pathname === "/healthz") {
      return json({ ok: true, service: "s-agentos-kernel", kernel_version: KERNEL_VERSION });
    }

    if (!isAuthorized(request, env)) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    if (request.method === "POST" && url.pathname === "/s-agentos-command") {
      let body;
      try { body = await request.json(); }
      catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }

      const cmd = normalize(body);

      if (cmd.run_mode === "live" && cmd.approval_status !== "approved") {
        return json({ ok: false, error: "live run_mode requires approval_status: approved", command_id: cmd.command_id }, 403);
      }

      const db = makeDb(env);

      // Audit log — write every command except health_check
      if (cmd.action !== "health_check") {
        try {
          await db.insert("os_commands", {
            command_id:      cmd.command_id,
            trace_id:        cmd.trace_id,
            idempotency_key: cmd.idempotency_key,
            action:          cmd.action,
            objective:       cmd.objective,
            requested_by:    cmd.requested_by,
            priority:        cmd.priority,
            run_mode:        cmd.run_mode,
            approval_status: cmd.approval_status,
            agent_id:        cmd.agent_id,
            context:         cmd.context,
            metadata:        cmd.metadata,
            kernel_version:  KERNEL_VERSION,
          });
        } catch (e) {
          console.error("Audit log failed:", e.message);
        }
      }

      try {
        const result = await dispatch(cmd, db);
        return json({ ...result, command_id: cmd.command_id });
      } catch (e) {
        console.error(`Action ${cmd.action} error:`, e.message);
        return json({ ok: false, error: e.message, command_id: cmd.command_id }, 500);
      }
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
};
