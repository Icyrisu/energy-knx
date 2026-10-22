-- =============================================================================
-- Migration 002: Seed Meters & Default Non-Secret Configurations
-- =============================================================================

-- Seed the two primary 3-phase meters
INSERT INTO meters (id, name, tag, description, sort_order, enabled)
VALUES
  ('kwh-besar', 'KWH BESAR', 'Meter 1', 'Main incoming 3-phase power meter', 1, TRUE),
  ('kwh-kecil', 'KWH KECIL', 'Meter 2', 'Sub-distribution 3-phase power meter', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tag = EXCLUDED.tag,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Seed sample alarm rules (disabled by default so operator can customize and enable)
INSERT INTO alarm_rules (meter_id, parameter, operator, threshold, hysteresis, severity, enabled, description)
VALUES
  ('kwh-besar', 'voltageR', '>', 242.0, 2.0, 'warning', FALSE, 'Tegangan Fasa R KWH BESAR melebihi ambang batas normal (> 242V)'),
  ('kwh-besar', 'voltageR', '<', 198.0, 2.0, 'warning', FALSE, 'Tegangan Fasa R KWH BESAR di bawah ambang batas normal (< 198V)'),
  ('kwh-besar', 'currentR', '>', 35.0, 1.0, 'critical', FALSE, 'Arus Fasa R KWH BESAR mendekati kapasitas maksimal (> 35A)'),
  ('kwh-besar', 'totalWatt', '>', 10000.0, 200.0, 'critical', FALSE, 'Total daya aktif KWH BESAR melebihi 10kW'),
  ('kwh-kecil', 'voltageR', '>', 242.0, 2.0, 'warning', FALSE, 'Tegangan Fasa R KWH KECIL melebihi batas normal (> 242V)'),
  ('kwh-kecil', 'totalWatt', '>', 8000.0, 150.0, 'critical', FALSE, 'Total daya aktif KWH KECIL melebihi 8kW')
ON CONFLICT DO NOTHING;

-- Seed default app settings
INSERT INTO app_settings (key, value)
VALUES
  ('displayTimezone', '"Asia/Jakarta"'::jsonb),
  ('staleAfterSeconds', '10'::jsonb),
  ('defaultTrendRange', '"24h"'::jsonb),
  ('theme', '"dark"'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
