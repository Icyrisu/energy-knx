import { ConnectionStatus, MeterValues, SourceMode } from './telemetry.js';
import { ParameterKey } from './parameters.js';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface HistoricalSampleRow extends MeterValues {
  id: string;
  meterId: string;
  meterName?: string;
  timestamp: string;
  source: SourceMode;
}

export interface HistoryQueryParams {
  meterId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface HistoryQueryResponse {
  items: HistoricalSampleRow[];
  pagination: PaginationMeta;
}

export interface TrendQueryParams {
  meterIds?: string[];
  parameters?: ParameterKey[];
  from: string;
  to: string;
  bucket?: '1m' | '5m' | '15m' | '1h' | '1d' | 'auto';
}

export interface TrendDataPoint {
  timestamp: string;
  value: number | null;
}

export interface TrendSeries {
  meterId: string;
  parameter: ParameterKey;
  unit: string;
  data: TrendDataPoint[];
}

export interface TrendQueryResponse {
  bucket: string;
  series: TrendSeries[];
}

export interface AlarmRule {
  id: number;
  meterId: string | null;
  parameter: ParameterKey;
  operator: '>' | '<';
  threshold: number;
  hysteresis: number;
  severity: 'warning' | 'critical';
  enabled: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AlarmEvent {
  id: number;
  ruleId: number | null;
  meterId: string;
  parameter: ParameterKey;
  alarmType: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  status: 'active' | 'cleared';
  acknowledgedAt: string | null;
  raisedAt: string;
  clearedAt: string | null;
}

export interface MeterConfig {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  displayTimezone: string;
  staleAfterSeconds: number;
  defaultTrendRange: string;
  theme: 'dark' | 'light' | 'system';
  historyIntervalSeconds?: number;
}

export interface ControlPoint {
  tag: string;
  label: string;
  unitId: number;
  fc: number;
  address: number;
  type: 'bool' | 'int16' | 'uint16' | 'float32';
  scale?: number;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
}

export interface ControlWriteRequest {
  tag: string;
  value: number | boolean;
}

export interface ControlLogEntry {
  id: number;
  ts: string;
  tag: string;
  value: number;
  success: boolean;
  error?: string | null;
}

