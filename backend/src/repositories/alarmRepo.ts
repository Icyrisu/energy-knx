import { AlarmEvent, AlarmRule, ParameterKey } from '@energy/shared';
import { pool } from '../db/pool.js';

interface AlarmRuleDbRow {
  id: number;
  meter_id: string | null;
  parameter: string;
  operator: string;
  threshold: number;
  hysteresis: number;
  severity: string;
  enabled: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AlarmEventDbRow {
  id: string;
  rule_id: number | null;
  meter_id: string;
  parameter: string;
  alarm_type: string;
  value: number;
  threshold: number;
  severity: string;
  status: string;
  acknowledged_at: Date | null;
  raised_at: Date;
  cleared_at: Date | null;
}

function mapRule(r: AlarmRuleDbRow): AlarmRule {
  return {
    id: r.id,
    meterId: r.meter_id,
    parameter: r.parameter as ParameterKey,
    operator: r.operator as '>' | '<',
    threshold: Number(r.threshold),
    hysteresis: Number(r.hysteresis),
    severity: r.severity as 'warning' | 'critical',
    enabled: r.enabled,
    description: r.description ?? undefined,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

function mapEvent(r: AlarmEventDbRow): AlarmEvent {
  return {
    id: Number(r.id),
    ruleId: r.rule_id,
    meterId: r.meter_id,
    parameter: r.parameter as ParameterKey,
    alarmType: r.alarm_type,
    value: Number(r.value),
    threshold: Number(r.threshold),
    severity: r.severity as 'warning' | 'critical',
    status: r.status as 'active' | 'cleared',
    acknowledgedAt: r.acknowledged_at ? r.acknowledged_at.toISOString() : null,
    raisedAt: r.raised_at.toISOString(),
    clearedAt: r.cleared_at ? r.cleared_at.toISOString() : null,
  };
}

export const alarmRepo = {
  async getActiveAlarms(): Promise<AlarmEvent[]> {
    const { rows } = await pool.query<AlarmEventDbRow>(
      `SELECT id, rule_id, meter_id, parameter, alarm_type, value, threshold, severity, status, acknowledged_at, raised_at, cleared_at
       FROM alarm_events
       WHERE status = 'active'
       ORDER BY raised_at DESC`
    );
    return rows.map(mapEvent);
  },

  async getAlarmHistory(params: {
    status?: string;
    meterId?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: AlarmEvent[]; total: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (params.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params.meterId) {
      conditions.push(`meter_id = $${idx++}`);
      values.push(params.meterId);
    }
    if (params.from) {
      conditions.push(`raised_at >= $${idx++}`);
      values.push(new Date(params.from));
    }
    if (params.to) {
      conditions.push(`raised_at <= $${idx++}`);
      values.push(new Date(params.to));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM alarm_events ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const dataRes = await pool.query<AlarmEventDbRow>(
      `SELECT id, rule_id, meter_id, parameter, alarm_type, value, threshold, severity, status, acknowledged_at, raised_at, cleared_at
       FROM alarm_events
       ${whereClause}
       ORDER BY raised_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, pageSize, offset]
    );

    return {
      items: dataRes.rows.map(mapEvent),
      total,
    };
  },

  async acknowledge(id: number): Promise<boolean> {
    const res = await pool.query(
      `UPDATE alarm_events SET acknowledged_at = NOW() WHERE id = $1 AND acknowledged_at IS NULL`,
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async getRules(): Promise<AlarmRule[]> {
    const { rows } = await pool.query<AlarmRuleDbRow>(
      `SELECT id, meter_id, parameter, operator, threshold, hysteresis, severity, enabled, description, created_at, updated_at
       FROM alarm_rules
       ORDER BY id ASC`
    );
    return rows.map(mapRule);
  },

  async updateRule(
    id: number,
    updates: Partial<Omit<AlarmRule, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AlarmRule | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.threshold !== undefined) {
      fields.push(`threshold = $${idx++}`);
      values.push(updates.threshold);
    }
    if (updates.hysteresis !== undefined) {
      fields.push(`hysteresis = $${idx++}`);
      values.push(updates.hysteresis);
    }
    if (updates.operator !== undefined) {
      fields.push(`operator = $${idx++}`);
      values.push(updates.operator);
    }
    if (updates.severity !== undefined) {
      fields.push(`severity = $${idx++}`);
      values.push(updates.severity);
    }
    if (updates.enabled !== undefined) {
      fields.push(`enabled = $${idx++}`);
      values.push(updates.enabled);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(updates.description);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE alarm_rules
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, meter_id, parameter, operator, threshold, hysteresis, severity, enabled, description, created_at, updated_at
    `;

    const { rows } = await pool.query<AlarmRuleDbRow>(query, values);
    return rows.length > 0 ? mapRule(rows[0]) : null;
  },

  async raiseEvent(event: {
    ruleId: number;
    meterId: string;
    parameter: string;
    alarmType: string;
    value: number;
    threshold: number;
    severity: string;
  }): Promise<AlarmEvent> {
    const query = `
      INSERT INTO alarm_events (
        rule_id, meter_id, parameter, alarm_type,
        value, threshold, severity, status, raised_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
      RETURNING id, rule_id, meter_id, parameter, alarm_type, value, threshold, severity, status, acknowledged_at, raised_at, cleared_at
    `;
    const { rows } = await pool.query<AlarmEventDbRow>(query, [
      event.ruleId,
      event.meterId,
      event.parameter,
      event.alarmType,
      event.value,
      event.threshold,
      event.severity,
    ]);
    return mapEvent(rows[0]);
  },

  async clearActiveEventByRule(ruleId: number, meterId: string): Promise<AlarmEvent | null> {
    const query = `
      UPDATE alarm_events
      SET status = 'cleared', cleared_at = NOW()
      WHERE rule_id = $1 AND meter_id = $2 AND status = 'active'
      RETURNING id, rule_id, meter_id, parameter, alarm_type, value, threshold, severity, status, acknowledged_at, raised_at, cleared_at
    `;
    const { rows } = await pool.query<AlarmEventDbRow>(query, [ruleId, meterId]);
    return rows.length > 0 ? mapEvent(rows[0]) : null;
  },
};
