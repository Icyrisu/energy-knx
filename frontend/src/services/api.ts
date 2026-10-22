import {
  AlarmEvent,
  AlarmRule,
  AppSettings,
  HistoricalSampleRow,
  HistoryQueryParams,
  MeterConfig,
  PaginationMeta,
  SystemStatusSnapshot,
  TrendQueryResponse,
} from '@energy/shared';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error?.message || `Request failed with status ${res.status}`);
  }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  async getLatestSnapshot(): Promise<SystemStatusSnapshot> {
    return fetchJson<SystemStatusSnapshot>(`${API_BASE}/monitoring/latest`);
  },

  async getMeters(): Promise<MeterConfig[]> {
    return fetchJson<MeterConfig[]>(`${API_BASE}/meters`);
  },

  async updateMeter(id: string, updates: { name?: string; description?: string }): Promise<MeterConfig> {
    return fetchJson<MeterConfig>(`${API_BASE}/meters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async getHistory(params: HistoryQueryParams): Promise<{ items: HistoricalSampleRow[]; pagination: PaginationMeta }> {
    const q = new URLSearchParams();
    if (params.meterId) q.set('meterId', params.meterId);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    if (params.page) q.set('page', params.page.toString());
    if (params.pageSize) q.set('pageSize', params.pageSize.toString());

    const res = await fetch(`${API_BASE}/history?${q.toString()}`);
    const json = await res.json();
    return {
      items: json.data || [],
      pagination: json.meta?.pagination || { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
    };
  },

  getExportCsvUrl(meterId?: string, from?: string, to?: string): string {
    const q = new URLSearchParams();
    if (meterId) q.set('meterId', meterId);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    return `${API_BASE}/history/export.csv?${q.toString()}`;
  },

  async getTrends(
    meterIds: string[],
    parameters: string[],
    from: string,
    to: string,
    bucket?: string
  ): Promise<TrendQueryResponse> {
    const q = new URLSearchParams({
      meterIds: meterIds.join(','),
      parameters: parameters.join(','),
      from,
      to,
    });
    if (bucket) q.set('bucket', bucket);

    return fetchJson<TrendQueryResponse>(`${API_BASE}/trends?${q.toString()}`);
  },

  async getActiveAlarms(): Promise<AlarmEvent[]> {
    return fetchJson<AlarmEvent[]>(`${API_BASE}/alarms`);
  },

  async getAlarmHistory(params: { status?: string; meterId?: string; page?: number }): Promise<{ items: AlarmEvent[]; total: number }> {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.meterId) q.set('meterId', params.meterId);
    if (params.page) q.set('page', params.page.toString());

    const res = await fetch(`${API_BASE}/alarms/history?${q.toString()}`);
    const json = await res.json();
    return {
      items: json.data || [],
      total: json.meta?.total || 0,
    };
  },

  async acknowledgeAlarm(id: number): Promise<boolean> {
    const res = await fetchJson<{ acknowledged: boolean }>(`${API_BASE}/alarms/${id}/acknowledge`, {
      method: 'POST',
    });
    return res.acknowledged;
  },

  async getAlarmRules(): Promise<AlarmRule[]> {
    return fetchJson<AlarmRule[]>(`${API_BASE}/alarms/rules`);
  },

  async updateAlarmRule(id: number, updates: Partial<AlarmRule>): Promise<AlarmRule> {
    return fetchJson<AlarmRule>(`${API_BASE}/alarms/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getSettings(): Promise<AppSettings> {
    return fetchJson<AppSettings>(`${API_BASE}/settings`);
  },

  async updateSetting(key: string, value: unknown): Promise<AppSettings> {
    return fetchJson<AppSettings>(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  async getControlPoints(): Promise<any[]> {
    return fetchJson<any[]>(`${API_BASE}/control/points`);
  },

  async writeControlPoint(tag: string, value: number | boolean): Promise<any> {
    return fetchJson<any>(`${API_BASE}/control/write`, {
      method: 'POST',
      body: JSON.stringify({ tag, value }),
    });
  },

  async getControlLogs(): Promise<any[]> {
    return fetchJson<any[]>(`${API_BASE}/control/logs`);
  },
};
