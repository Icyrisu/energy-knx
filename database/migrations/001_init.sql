-- =============================================================================
-- Migration 001: Initial Schema
-- Energy SCADA Dashboard (3-Phase Monitoring: 2 Meters x 14 Parameters)
-- =============================================================================

-- Table: schema_migrations (tracks applied migrations)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: meters
CREATE TABLE IF NOT EXISTS meters (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  tag VARCHAR(64) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: telemetry_samples (14 electrical parameters per record)
CREATE TABLE IF NOT EXISTS telemetry_samples (
  id BIGSERIAL PRIMARY KEY,
  meter_id VARCHAR(64) NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  source VARCHAR(32) NOT NULL CHECK (source IN ('simulation', 'device')),

  -- Voltage (V)
  voltage_r DOUBLE PRECISION NOT NULL,
  voltage_s DOUBLE PRECISION NOT NULL,
  voltage_t DOUBLE PRECISION NOT NULL,

  -- Current (A)
  current_r DOUBLE PRECISION NOT NULL,
  current_s DOUBLE PRECISION NOT NULL,
  current_t DOUBLE PRECISION NOT NULL,

  -- Active Power (W)
  watt_r DOUBLE PRECISION NOT NULL,
  watt_s DOUBLE PRECISION NOT NULL,
  watt_t DOUBLE PRECISION NOT NULL,

  -- Energy (kWh)
  kwh_r DOUBLE PRECISION NOT NULL,
  kwh_s DOUBLE PRECISION NOT NULL,
  kwh_t DOUBLE PRECISION NOT NULL,

  -- Totals
  total_watt DOUBLE PRECISION NOT NULL,
  total_kwh DOUBLE PRECISION NOT NULL,

  CONSTRAINT uq_meter_sample_ts UNIQUE (meter_id, ts)
);

-- Indices for rapid time-series & history range queries
CREATE INDEX IF NOT EXISTS idx_telemetry_samples_meter_ts 
  ON telemetry_samples (meter_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_samples_ts 
  ON telemetry_samples (ts DESC);

-- Table: alarm_rules
CREATE TABLE IF NOT EXISTS alarm_rules (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(64) REFERENCES meters(id) ON DELETE CASCADE,
  parameter VARCHAR(64) NOT NULL,
  operator VARCHAR(2) NOT NULL CHECK (operator IN ('>', '<')),
  threshold DOUBLE PRECISION NOT NULL,
  hysteresis DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  severity VARCHAR(32) NOT NULL CHECK (severity IN ('warning', 'critical')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: alarm_events
CREATE TABLE IF NOT EXISTS alarm_events (
  id BIGSERIAL PRIMARY KEY,
  rule_id INT REFERENCES alarm_rules(id) ON DELETE SET NULL,
  meter_id VARCHAR(64) NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  parameter VARCHAR(64) NOT NULL,
  alarm_type VARCHAR(64) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  threshold DOUBLE PRECISION NOT NULL,
  severity VARCHAR(32) NOT NULL CHECK (severity IN ('warning', 'critical')),
  status VARCHAR(32) NOT NULL CHECK (status IN ('active', 'cleared')),
  acknowledged_at TIMESTAMPTZ,
  raised_at TIMESTAMPTZ NOT NULL,
  cleared_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alarm_events_raised_at 
  ON alarm_events (raised_at DESC);

CREATE INDEX IF NOT EXISTS idx_alarm_events_meter_status 
  ON alarm_events (meter_id, status);

-- Table: app_settings (key-value store for non-secret operational settings)
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
