import { AppSettings } from '@energy/shared';
import { pool } from '../db/pool.js';

const ALLOWED_SETTING_KEYS = [
  'displayTimezone',
  'staleAfterSeconds',
  'defaultTrendRange',
  'theme',
  'historyIntervalSeconds',
] as const;

type AllowedKey = (typeof ALLOWED_SETTING_KEYS)[number];

const DEFAULT_SETTINGS: AppSettings = {
  displayTimezone: 'Asia/Jakarta',
  staleAfterSeconds: 10,
  defaultTrendRange: '24h',
  theme: 'dark',
  historyIntervalSeconds: 60,
};

export const settingsRepo = {
  async getAll(): Promise<AppSettings> {
    const { rows } = await pool.query<{ key: string; value: unknown }>(
      'SELECT key, value FROM app_settings'
    );

    const result: AppSettings = { ...DEFAULT_SETTINGS };

    for (const row of rows) {
      if (row.key === 'displayTimezone' && typeof row.value === 'string') {
        result.displayTimezone = row.value;
      } else if (row.key === 'staleAfterSeconds' && typeof row.value === 'number') {
        result.staleAfterSeconds = row.value;
      } else if (row.key === 'defaultTrendRange' && typeof row.value === 'string') {
        result.defaultTrendRange = row.value;
      } else if (row.key === 'historyIntervalSeconds' && typeof row.value === 'number') {
        result.historyIntervalSeconds = row.value;
      } else if (
        row.key === 'theme' &&
        (row.value === 'dark' || row.value === 'light' || row.value === 'system')
      ) {
        result.theme = row.value;
      }
    }

    return result;
  },

  async update(key: AllowedKey, value: unknown): Promise<void> {
    if (!ALLOWED_SETTING_KEYS.includes(key)) {
      throw new Error(`Setting key "${key}" is not allowed`);
    }

    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  },
};
