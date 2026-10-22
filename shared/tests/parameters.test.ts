import { describe, expect, it } from 'vitest';
import {
  METER_IDS,
  METER_PARAMETERS,
  meterReadingPayloadSchema,
  telemetryBatchSchema,
} from '../src/index.js';

describe('Energy SCADA Parameters & Contracts', () => {
  it('must contain exactly 14 parameters per meter', () => {
    expect(METER_PARAMETERS.length).toBe(14);
  });

  it('must define exactly 2 meters resulting in 28 total monitoring parameters', () => {
    expect(METER_IDS.length).toBe(2);
    const totalMonitoredParameters = METER_IDS.length * METER_PARAMETERS.length;
    expect(totalMonitoredParameters).toBe(28);
  });

  it('must have unique keys for all 14 parameters', () => {
    const keys = METER_PARAMETERS.map((p) => p.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(14);
  });

  it('validates a valid telemetry batch payload', () => {
    const sample = {
      readings: [
        {
          meterId: 'kwh-besar',
          timestamp: new Date().toISOString(),
          connectionStatus: 'online',
          source: 'simulation',
          values: {
            voltageR: 220.5,
            voltageS: 221.2,
            voltageT: 219.8,
            currentR: 5.2,
            currentS: 4.8,
            currentT: 5.0,
            wattR: 1100.0,
            wattS: 1050.0,
            wattT: 1080.0,
            kwhR: 120.4,
            kwhS: 115.2,
            kwhT: 118.9,
            totalWatt: 3230.0,
            totalKwh: 354.5,
          },
        },
      ],
    };

    const parsed = telemetryBatchSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });

  it('allows null values when connectionStatus is error or offline', () => {
    const sample = {
      readings: [
        {
          meterId: 'kwh-kecil',
          timestamp: new Date().toISOString(),
          connectionStatus: 'error',
          source: 'device',
          values: null,
          error: 'Connection timeout: Modbus slave did not respond',
        },
      ],
    };

    const parsed = telemetryBatchSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });

  it('rejects payload with missing parameters or NaN values', () => {
    const invalidSample = {
      readings: [
        {
          meterId: 'kwh-besar',
          timestamp: new Date().toISOString(),
          connectionStatus: 'online',
          source: 'simulation',
          values: {
            voltageR: 'not-a-number', // invalid string
          },
        },
      ],
    };

    const parsed = telemetryBatchSchema.safeParse(invalidSample);
    expect(parsed.success).toBe(false);
  });
});
