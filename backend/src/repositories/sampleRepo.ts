import {
  HistoricalSampleRow,
  HistoryQueryParams,
  HistoryQueryResponse,
  MeterValues,
  METER_PARAMETERS,
  ParameterKey,
  SourceMode,
  TrendQueryResponse,
  TrendSeries,
} from '@energy/shared';
import { pool } from '../db/pool.js';

interface SampleDbRow {
  id: string;
  meter_id: string;
  meter_name?: string;
  ts: Date;
  source: string;
  voltage_r: number;
  voltage_s: number;
  voltage_t: number;
  current_r: number;
  current_s: number;
  current_t: number;
  watt_r: number;
  watt_s: number;
  watt_t: number;
  kwh_r: number;
  kwh_s: number;
  kwh_t: number;
  total_watt: number;
  total_kwh: number;
}

function mapSampleRow(r: SampleDbRow): HistoricalSampleRow {
  return {
    id: r.id.toString(),
    meterId: r.meter_id,
    meterName: r.meter_name,
    timestamp: r.ts.toISOString(),
    source: r.source as SourceMode,
    voltageR: Number(r.voltage_r),
    voltageS: Number(r.voltage_s),
    voltageT: Number(r.voltage_t),
    currentR: Number(r.current_r),
    currentS: Number(r.current_s),
    currentT: Number(r.current_t),
    wattR: Number(r.watt_r),
    wattS: Number(r.watt_s),
    wattT: Number(r.watt_t),
    kwhR: Number(r.kwh_r),
    kwhS: Number(r.kwh_s),
    kwhT: Number(r.kwh_t),
    totalWatt: Number(r.total_watt),
    totalKwh: Number(r.total_kwh),
  };
}

const PARAM_COL_MAP: Record<ParameterKey, string> = {
  voltageR: 'voltage_r',
  voltageS: 'voltage_s',
  voltageT: 'voltage_t',
  currentR: 'current_r',
  currentS: 'current_s',
  currentT: 'current_t',
  wattR: 'watt_r',
  wattS: 'watt_s',
  wattT: 'watt_t',
  kwhR: 'kwh_r',
  kwhS: 'kwh_s',
  kwhT: 'kwh_t',
  totalWatt: 'total_watt',
  totalKwh: 'total_kwh',
};

export const sampleRepo = {
  async insertSample(
    meterId: string,
    ts: Date,
    source: SourceMode,
    values: MeterValues
  ): Promise<boolean> {
    const query = `
      INSERT INTO telemetry_samples (
        meter_id, ts, source,
        voltage_r, voltage_s, voltage_t,
        current_r, current_s, current_t,
        watt_r, watt_s, watt_t,
        kwh_r, kwh_s, kwh_t,
        total_watt, total_kwh
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15,
        $16, $17
      )
      ON CONFLICT (meter_id, ts) DO NOTHING
    `;

    const res = await pool.query(query, [
      meterId,
      ts,
      source,
      values.voltageR,
      values.voltageS,
      values.voltageT,
      values.currentR,
      values.currentS,
      values.currentT,
      values.wattR,
      values.wattS,
      values.wattT,
      values.kwhR,
      values.kwhS,
      values.kwhT,
      values.totalWatt,
      values.totalKwh,
    ]);

    return (res.rowCount ?? 0) > 0;
  },

  async getHistory(params: HistoryQueryParams): Promise<HistoryQueryResponse> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(500, Math.max(1, params.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (params.meterId) {
      conditions.push(`s.meter_id = $${idx++}`);
      values.push(params.meterId);
    }
    if (params.from) {
      conditions.push(`s.ts >= $${idx++}`);
      values.push(new Date(params.from));
    }
    if (params.to) {
      conditions.push(`s.ts <= $${idx++}`);
      values.push(new Date(params.to));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) AS total FROM telemetry_samples s ${whereClause}`;
    const countResult = await pool.query<{ total: string }>(countQuery, values);
    const totalItems = parseInt(countResult.rows[0]?.total || '0', 10);
    const totalPages = Math.ceil(totalItems / pageSize);

    const dataQuery = `
      SELECT 
        s.id, s.meter_id, m.name AS meter_name, s.ts, s.source,
        s.voltage_r, s.voltage_s, s.voltage_t,
        s.current_r, s.current_s, s.current_t,
        s.watt_r, s.watt_s, s.watt_t,
        s.kwh_r, s.kwh_s, s.kwh_t,
        s.total_watt, s.total_kwh
      FROM telemetry_samples s
      JOIN meters m ON s.meter_id = m.id
      ${whereClause}
      ORDER BY s.ts DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const dataResult = await pool.query<SampleDbRow>(dataQuery, [...values, pageSize, offset]);

    return {
      items: dataResult.rows.map(mapSampleRow),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  },

  async getTrendSeries(
    meterIds: string[],
    parameters: ParameterKey[],
    from: string,
    to: string,
    requestedBucket: string = 'auto'
  ): Promise<TrendQueryResponse> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffMs = toDate.getTime() - fromDate.getTime();

    // Determine bucket size
    let intervalStr = '5 minutes';
    let bucketName = '5m';

    if (requestedBucket === '1m' || (requestedBucket === 'auto' && diffMs <= 2 * 3600 * 1000)) {
      intervalStr = '1 minute';
      bucketName = '1m';
    } else if (requestedBucket === '5m' || (requestedBucket === 'auto' && diffMs <= 12 * 3600 * 1000)) {
      intervalStr = '5 minutes';
      bucketName = '5m';
    } else if (requestedBucket === '15m' || (requestedBucket === 'auto' && diffMs <= 24 * 3600 * 1000)) {
      intervalStr = '15 minutes';
      bucketName = '15m';
    } else if (requestedBucket === '1h' || (requestedBucket === 'auto' && diffMs <= 7 * 24 * 3600 * 1000)) {
      intervalStr = '1 hour';
      bucketName = '1h';
    } else {
      intervalStr = '1 day';
      bucketName = '1d';
    }

    const seriesList: TrendSeries[] = [];

    for (const meterId of meterIds) {
      for (const paramKey of parameters) {
        const paramDef = METER_PARAMETERS.find((p) => p.key === paramKey);
        const colName = PARAM_COL_MAP[paramKey];
        if (!paramDef || !colName) continue;

        const aggFn = paramDef.agg === 'last' ? `MAX(${colName})` : `ROUND(AVG(${colName})::numeric, ${paramDef.decimals})`;

        const query = `
          SELECT 
            date_bin(INTERVAL '${intervalStr}', ts, TIMESTAMPTZ '2000-01-01 00:00:00Z') AS bucket_ts,
            ${aggFn} AS val
          FROM telemetry_samples
          WHERE meter_id = $1 AND ts >= $2 AND ts <= $3
          GROUP BY bucket_ts
          ORDER BY bucket_ts ASC
        `;

        const res = await pool.query<{ bucket_ts: Date; val: string | number | null }>(query, [
          meterId,
          fromDate,
          toDate,
        ]);

        seriesList.push({
          meterId,
          parameter: paramKey,
          unit: paramDef.unit,
          data: res.rows.map((r) => ({
            timestamp: r.bucket_ts.toISOString(),
            value: r.val !== null ? Number(r.val) : null,
          })),
        });
      }
    }

    return {
      bucket: bucketName,
      series: seriesList,
    };
  },

  async queryCsvRows(meterId?: string, from?: string, to?: string): Promise<SampleDbRow[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (meterId) {
      conditions.push(`s.meter_id = $${idx++}`);
      values.push(meterId);
    }
    if (from) {
      conditions.push(`s.ts >= $${idx++}`);
      values.push(new Date(from));
    }
    if (to) {
      conditions.push(`s.ts <= $${idx++}`);
      values.push(new Date(to));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT 
        s.id, s.meter_id, m.name AS meter_name, s.ts, s.source,
        s.voltage_r, s.voltage_s, s.voltage_t,
        s.current_r, s.current_s, s.current_t,
        s.watt_r, s.watt_s, s.watt_t,
        s.kwh_r, s.kwh_s, s.kwh_t,
        s.total_watt, s.total_kwh
      FROM telemetry_samples s
      JOIN meters m ON s.meter_id = m.id
      ${whereClause}
      ORDER BY s.ts DESC
      LIMIT 10000
    `;

    const { rows } = await pool.query<SampleDbRow>(query, values);
    return rows;
  },

  async deleteOlderThanDays(days: number): Promise<number> {
    if (days <= 0) return 0;
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    const res = await pool.query('DELETE FROM telemetry_samples WHERE ts < $1', [cutoff]);
    return res.rowCount ?? 0;
  },
};
