import { ControlLogEntry } from '@energy/shared';
import { pool } from '../db/pool.js';

interface ControlLogDbRow {
  id: string | number;
  ts: Date;
  tag: string;
  value: number;
  success: boolean;
  error: string | null;
}

export const controlRepo = {
  async insertLog(tag: string, value: number, success: boolean, error?: string | null): Promise<void> {
    try {
      await pool.query(
        'INSERT INTO control_log (tag, value, success, error) VALUES ($1, $2, $3, $4)',
        [tag, value, success, error || null]
      );
    } catch (err) {
      console.error('[controlRepo] Failed to log control action:', err);
    }
  },

  async getRecentLogs(limit = 50): Promise<ControlLogEntry[]> {
    try {
      const { rows } = await pool.query<ControlLogDbRow>(
        'SELECT id, ts, tag, value, success, error FROM control_log ORDER BY ts DESC LIMIT $1',
        [limit]
      );

      return rows.map((r) => ({
        id: Number(r.id),
        ts: r.ts.toISOString(),
        tag: r.tag,
        value: Number(r.value),
        success: r.success,
        error: r.error,
      }));
    } catch {
      return [];
    }
  },
};
