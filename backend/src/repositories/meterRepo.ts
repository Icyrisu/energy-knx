import { MeterConfig } from '@energy/shared';
import { pool } from '../db/pool.js';

interface MeterDbRow {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  sort_order: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: MeterDbRow): MeterConfig {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    enabled: row.enabled,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const meterRepo = {
  async getAll(): Promise<MeterConfig[]> {
    const { rows } = await pool.query<MeterDbRow>(
      'SELECT id, name, tag, description, sort_order, enabled, created_at, updated_at FROM meters ORDER BY sort_order ASC'
    );
    return rows.map(mapRow);
  },

  async getById(id: string): Promise<MeterConfig | null> {
    const { rows } = await pool.query<MeterDbRow>(
      'SELECT id, name, tag, description, sort_order, enabled, created_at, updated_at FROM meters WHERE id = $1',
      [id]
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },

  async update(id: string, updates: { name?: string; description?: string }): Promise<MeterConfig | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(updates.description);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE meters
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, tag, description, sort_order, enabled, created_at, updated_at
    `;

    const { rows } = await pool.query<MeterDbRow>(query, values);
    return rows.length > 0 ? mapRow(rows[0]) : null;
  },
};
