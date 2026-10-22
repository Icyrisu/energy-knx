import { ControlPoint } from '@energy/shared';
import { env } from '../config/env.js';

export interface WriteResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class NodeRedClient {
  public async getPoints(): Promise<ControlPoint[]> {
    try {
      const res = await fetch(`${env.NODERED_URL}/modbus/points`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`Node-RED returned HTTP ${res.status}`);
      }

      const data = await res.json() as { points?: ControlPoint[] } | ControlPoint[];
      if (Array.isArray(data)) return data;
      return data.points || [];
    } catch (err) {
      console.warn(`[NodeRedClient] Failed to fetch points from Node-RED: ${(err as Error).message}`);
      return [];
    }
  }

  public async write(tag: string, value: number | boolean): Promise<WriteResult> {
    const res = await fetch(`${env.NODERED_URL}/modbus/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': env.INTERNAL_API_SECRET,
      },
      body: JSON.stringify({ tag, value }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Node-RED write failed (HTTP ${res.status}): ${errText || res.statusText}`);
    }

    const data = await res.json().catch(() => ({ success: true })) as WriteResult;
    return { success: true, message: data.message || 'Write command accepted' };
  }
}

export const noderedClient = new NodeRedClient();
