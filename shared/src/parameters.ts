export type Phase = 'R' | 'S' | 'T';

export type ParameterGroup = 'voltage' | 'current' | 'power' | 'energy' | 'total';

export type AggregationMethod = 'avg' | 'last' | 'max' | 'min' | 'sum';

export interface MeterParameterDefinition {
  readonly key: string;
  readonly label: string;
  readonly group: ParameterGroup;
  readonly phase?: Phase;
  readonly unit: 'V' | 'A' | 'W' | 'kWh';
  readonly agg: AggregationMethod;
  readonly decimals: number;
}

export const METER_PARAMETERS = [
  // Voltage (V)
  { key: 'voltageR', label: 'Voltage R', group: 'voltage', phase: 'R', unit: 'V', agg: 'avg', decimals: 1 },
  { key: 'voltageS', label: 'Voltage S', group: 'voltage', phase: 'S', unit: 'V', agg: 'avg', decimals: 1 },
  { key: 'voltageT', label: 'Voltage T', group: 'voltage', phase: 'T', unit: 'V', agg: 'avg', decimals: 1 },

  // Current (A)
  { key: 'currentR', label: 'Current R', group: 'current', phase: 'R', unit: 'A', agg: 'avg', decimals: 1 },
  { key: 'currentS', label: 'Current S', group: 'current', phase: 'S', unit: 'A', agg: 'avg', decimals: 1 },
  { key: 'currentT', label: 'Current T', group: 'current', phase: 'T', unit: 'A', agg: 'avg', decimals: 1 },

  // Active Power (W)
  { key: 'wattR', label: 'Watt R', group: 'power', phase: 'R', unit: 'W', agg: 'avg', decimals: 1 },
  { key: 'wattS', label: 'Watt S', group: 'power', phase: 'S', unit: 'W', agg: 'avg', decimals: 1 },
  { key: 'wattT', label: 'Watt T', group: 'power', phase: 'T', unit: 'W', agg: 'avg', decimals: 1 },

  // Energy (kWh)
  { key: 'kwhR', label: 'KWH R', group: 'energy', phase: 'R', unit: 'kWh', agg: 'last', decimals: 1 },
  { key: 'kwhS', label: 'KWH S', group: 'energy', phase: 'S', unit: 'kWh', agg: 'last', decimals: 1 },
  { key: 'kwhT', label: 'KWH T', group: 'energy', phase: 'T', unit: 'kWh', agg: 'last', decimals: 1 },

  // Totals
  { key: 'totalWatt', label: 'TOTAL WATT', group: 'total', unit: 'W', agg: 'avg', decimals: 1 },
  { key: 'totalKwh', label: 'TOTAL KWH', group: 'total', unit: 'kWh', agg: 'last', decimals: 1 },
] as const;

export type ParameterKey = (typeof METER_PARAMETERS)[number]['key'];

export const PARAMETER_KEYS = METER_PARAMETERS.map((p) => p.key) as ParameterKey[];

export const METER_IDS = ['kwh-besar', 'kwh-kecil'] as const;
export type MeterId = (typeof METER_IDS)[number];

export interface MeterMetadata {
  id: MeterId;
  name: string;
  tag: string;
  sortOrder: number;
}

export const KNOWN_METERS: Record<MeterId, MeterMetadata> = {
  'kwh-besar': {
    id: 'kwh-besar',
    name: 'KWH BESAR',
    tag: 'Meter 1',
    sortOrder: 1,
  },
  'kwh-kecil': {
    id: 'kwh-kecil',
    name: 'KWH KECIL',
    tag: 'Meter 2',
    sortOrder: 2,
  },
};
