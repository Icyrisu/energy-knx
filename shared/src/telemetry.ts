import { z } from 'zod';
import { METER_IDS, ParameterKey } from './parameters.js';

const finiteNumber = z.number().refine((n) => Number.isFinite(n), {
  message: 'Value must be a finite number',
});

export const meterValuesSchema = z.object({
  voltageR: finiteNumber,
  voltageS: finiteNumber,
  voltageT: finiteNumber,

  currentR: finiteNumber,
  currentS: finiteNumber,
  currentT: finiteNumber,

  wattR: finiteNumber,
  wattS: finiteNumber,
  wattT: finiteNumber,

  kwhR: finiteNumber,
  kwhS: finiteNumber,
  kwhT: finiteNumber,

  totalWatt: finiteNumber,
  totalKwh: finiteNumber,
});

export type MeterValues = z.infer<typeof meterValuesSchema>;

export const connectionStatusSchema = z.enum(['online', 'offline', 'error']);
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;

export const sourceModeSchema = z.enum(['simulation', 'device']);
export type SourceMode = z.infer<typeof sourceModeSchema>;

export const meterReadingPayloadSchema = z.object({
  meterId: z.enum(METER_IDS),
  timestamp: z.string().datetime({ message: 'Must be ISO-8601 datetime' }),
  connectionStatus: connectionStatusSchema,
  source: sourceModeSchema,
  values: meterValuesSchema.nullable(),
  error: z.string().max(500).optional(),
});

export type MeterReadingPayload = z.infer<typeof meterReadingPayloadSchema>;

export const telemetryBatchSchema = z.object({
  readings: z.array(meterReadingPayloadSchema).min(1).max(10),
});

export type TelemetryBatchPayload = z.infer<typeof telemetryBatchSchema>;

/**
 * Live snapshot distributed to frontend clients via WebSocket / Latest API
 */
export interface MeterLiveSnapshot {
  meterId: string;
  meterName: string;
  tag: string;
  connectionStatus: ConnectionStatus;
  source: SourceMode;
  timestamp: string;
  isStale: boolean;
  values: MeterValues | null;
  error?: string;
}

export interface SystemStatusSnapshot {
  systemStatus: 'healthy' | 'degraded' | 'offline';
  sourceMode: SourceMode | 'mixed' | 'off';
  serverTime: string;
  activeAlarmsCount: number;
  meters: Record<string, MeterLiveSnapshot>;
}

export type WebSocketServerMessage =
  | { type: 'snapshot'; payload: SystemStatusSnapshot }
  | { type: 'telemetry'; payload: MeterLiveSnapshot }
  | { type: 'meter-status'; payload: { meterId: string; status: ConnectionStatus; isStale: boolean; timestamp: string } }
  | { type: 'alarm'; payload: { id: number; meterId: string; parameter: string; severity: string; status: string; message: string; raisedAt: string } }
  | { type: 'ping' };

export const controlWriteSchema = z.object({
  tag: z.string().min(1).max(64),
  value: z.union([z.number(), z.boolean()]),
});

