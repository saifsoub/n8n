-- ============================================================================
-- S/ AgentOS Kernel v0.2.0 — Migration 001
-- Adds idempotency, approval, and audit tables to the v0.1.3 schema.
-- Run AFTER schema.sql has been applied (v0.1.3 baseline).
-- ============================================================================
-- Usage: Execute this SQL in the Supabase SQL Editor after the base schema.
-- Safe to run multiple times (uses IF NOT EXISTS and CREATE OR REPLACE).
-- ============================================================================

-- ============================================================================
-- TABLE: idempotency_keys
-- Purpose: Prevents duplicate live execution when the same idempotency_key
--          is submitted more than once. Check before executing any live action.
-- ============================================================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  command_id      text NOT NULL,
  action          text NOT NULL,
  run_mode        text DEFAULT 'draft',
  result          jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  expires_at      timestamptz DEFAULT (now() + INTERVAL '24 hours')
);

COMMENT ON TABLE idempotency_keys IS
  'Tracks submitted idempotency keys to prevent duplicate live execution. '
  'Rows expire after 24 hours by default.';

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_command_id ON idempotency_keys (command_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys (expires_at);

-- ============================================================================
-- TABLE: approval_requests
-- Purpose: Tracks operator approval requests for live/consequential actions.
--          A 'live' run_mode action that is not in the approved_actions
--          allowlist must have an approval record with status='approved'.
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id      text NOT NULL,
  trace_id        text,
  action          text NOT NULL,
  run_mode        text DEFAULT 'live',
  approval_status text DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_by    text DEFAULT 'operator',
  approved_by     text,
  objective       text,
  context         jsonb DEFAULT '{}',
  notes           text,
  requested_at    timestamptz DEFAULT now(),
  decided_at      timestamptz,
  expires_at      timestamptz DEFAULT (now() + INTERVAL '1 hour'),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE approval_requests IS
  'Operator approval queue for live/consequential actions. '
  'live run_mode write operations check this table before execution.';

CREATE INDEX IF NOT EXISTS idx_approval_requests_command_id ON approval_requests (command_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_trace_id ON approval_requests (trace_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approval_status ON approval_requests (approval_status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_action ON approval_requests (action);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at ON approval_requests (created_at DESC);

CREATE OR REPLACE TRIGGER trg_approval_requests_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: audit_log
-- Purpose: Immutable append-only audit trail. Every command that passes auth
--          and reaches the routing stage is recorded here with the actor,
--          action, run_mode, and outcome. Cannot be updated or deleted via
--          normal operations (RLS policy enforces insert-only for service role).
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id      text NOT NULL,
  trace_id        text,
  idempotency_key text,
  action          text NOT NULL,
  objective       text,
  requested_by    text,
  run_mode        text,
  approval_status text,
  agent_id        text,
  outcome         text DEFAULT 'unknown'
    CHECK (outcome IN ('success', 'error', 'rejected', 'duplicate', 'unknown')),
  error_message   text,
  duration_ms     integer,
  kernel_version  text DEFAULT '0.2.0',
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE audit_log IS
  'Immutable audit trail. Every authenticated command is recorded. '
  'Append-only — do not UPDATE or DELETE rows.';

CREATE INDEX IF NOT EXISTS idx_audit_log_command_id ON audit_log (command_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_trace_id ON audit_log (trace_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_requested_by ON audit_log (requested_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_outcome ON audit_log (outcome);
CREATE INDEX IF NOT EXISTS idx_audit_log_kernel_version ON audit_log (kernel_version);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);

-- ============================================================================
-- COLUMN ADDITIONS: os_commands v0.2.0 fields
-- Adds trace_id and idempotency_key to the existing os_commands table.
-- Safe to run again (ALTER TABLE ADD COLUMN IF NOT EXISTS).
-- ============================================================================
ALTER TABLE os_commands
  ADD COLUMN IF NOT EXISTS trace_id text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'not_required';

CREATE INDEX IF NOT EXISTS idx_os_commands_trace_id ON os_commands (trace_id);
CREATE INDEX IF NOT EXISTS idx_os_commands_idempotency_key ON os_commands (idempotency_key);

-- Update kernel_version default for new rows
ALTER TABLE os_commands
  ALTER COLUMN kernel_version SET DEFAULT '0.2.0';

ALTER TABLE os_events
  ALTER COLUMN kernel_version SET DEFAULT '0.2.0';

-- ============================================================================
-- RLS NOTES (v0.2.0)
-- Enable after initial deployment is confirmed working.
-- Service-role key bypasses RLS. These policies apply to anon/authenticated.
-- ============================================================================

-- Example policies (uncomment to enable):
--
-- ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "audit_log_insert_only" ON audit_log FOR INSERT WITH CHECK (true);
-- CREATE POLICY "audit_log_select_authenticated" ON audit_log FOR SELECT USING (auth.role() = 'authenticated');
--
-- ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "idempotency_keys_service_only" ON idempotency_keys USING (false);
--
-- ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "approval_requests_authenticated" ON approval_requests USING (auth.role() = 'authenticated');

-- ============================================================================
-- STATISTICS
-- ============================================================================
-- Tables added: 3 (idempotency_keys, approval_requests, audit_log)
-- Columns added: 3 (os_commands.trace_id, .idempotency_key, .approval_status)
-- Indexes added: 13
-- Default updates: 2 (os_commands.kernel_version, os_events.kernel_version)
-- ============================================================================
