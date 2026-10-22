import { EventEmitter } from 'node:events';
import {
  ConnectionStatus,
  KNOWN_METERS,
  MeterId,
  MeterLiveSnapshot,
  MeterReadingPayload,
  SourceMode,
  SystemStatusSnapshot,
} from '@energy/shared';
import { env } from '../config/env.js';

class LiveStore extends EventEmitter {
  private snapshots: Map<string, MeterLiveSnapshot> = new Map();
  private staleTimer: NodeJS.Timeout | null = null;
  private activeAlarmsCount: number = 0;

  constructor() {
    super();
    this.initDefaultSnapshots();
    this.startStaleChecker();
  }

  private initDefaultSnapshots() {
    for (const [id, meta] of Object.entries(KNOWN_METERS)) {
      this.snapshots.set(id, {
        meterId: id,
        meterName: meta.name,
        tag: meta.tag,
        connectionStatus: 'offline',
        source: 'simulation',
        timestamp: new Date().toISOString(),
        isStale: true,
        values: null,
      });
    }
  }

  private startStaleChecker() {
    this.staleTimer = setInterval(() => {
      const now = Date.now();
      const thresholdMs = env.STALE_AFTER_SECONDS * 1000;

      for (const [meterId, snap] of this.snapshots.entries()) {
        if (!snap.isStale && snap.connectionStatus === 'online') {
          const sampleAge = now - new Date(snap.timestamp).getTime();
          if (sampleAge > thresholdMs) {
            snap.isStale = true;
            this.emit('meter-status', {
              meterId,
              status: snap.connectionStatus,
              isStale: true,
              timestamp: snap.timestamp,
            });
          }
        }
      }
    }, 2000);
  }

  public updateReading(reading: MeterReadingPayload): MeterLiveSnapshot {
    const meta = KNOWN_METERS[reading.meterId as MeterId] || {
      id: reading.meterId,
      name: reading.meterId.toUpperCase(),
      tag: 'Meter',
      sortOrder: 99,
    };

    const snapshot: MeterLiveSnapshot = {
      meterId: reading.meterId,
      meterName: meta.name,
      tag: meta.tag,
      connectionStatus: reading.connectionStatus,
      source: reading.source,
      timestamp: reading.timestamp,
      isStale: false,
      values: reading.values,
      error: reading.error,
    };

    this.snapshots.set(reading.meterId, snapshot);
    this.emit('telemetry', snapshot);

    return snapshot;
  }

  public getMeterSnapshot(meterId: string): MeterLiveSnapshot | null {
    return this.snapshots.get(meterId) || null;
  }

  public getAllSnapshots(): Record<string, MeterLiveSnapshot> {
    const obj: Record<string, MeterLiveSnapshot> = {};
    for (const [id, snap] of this.snapshots.entries()) {
      obj[id] = snap;
    }
    return obj;
  }

  public setActiveAlarmsCount(count: number) {
    this.activeAlarmsCount = count;
  }

  public getSystemSnapshot(): SystemStatusSnapshot {
    const meters = this.getAllSnapshots();
    const list = Object.values(meters);

    const anyOnline = list.some((m) => m.connectionStatus === 'online' && !m.isStale);
    const allOnline = list.length > 0 && list.every((m) => m.connectionStatus === 'online' && !m.isStale);

    let systemStatus: 'healthy' | 'degraded' | 'offline' = 'offline';
    if (allOnline) {
      systemStatus = 'healthy';
    } else if (anyOnline) {
      systemStatus = 'degraded';
    }

    const sources = new Set(list.map((m) => m.source));
    let sourceMode: SourceMode | 'mixed' | 'off' = 'off';
    if (sources.size === 1) {
      sourceMode = list[0]?.source ?? 'off';
    } else if (sources.size > 1) {
      sourceMode = 'mixed';
    }

    return {
      systemStatus,
      sourceMode,
      serverTime: new Date().toISOString(),
      activeAlarmsCount: this.activeAlarmsCount,
      meters,
    };
  }

  public stop() {
    if (this.staleTimer) {
      clearInterval(this.staleTimer);
      this.staleTimer = null;
    }
  }
}

export const liveStore = new LiveStore();
