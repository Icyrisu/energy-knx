-- =============================================================================
-- Migration 003: Control Audit Log
-- Logs two-way Modbus write operations initiated from dashboard / API
-- =============================================================================

CREATE TABLE IF NOT EXISTS control_log (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tag VARCHAR(64) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_control_log_ts ON control_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_control_log_tag ON control_log (tag, ts DESC);
