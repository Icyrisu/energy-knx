import { env } from '../config/env.js';
import { sampleRepo } from '../repositories/sampleRepo.js';
import { settingsRepo } from '../repositories/settingsRepo.js';
import { liveStore } from './liveStore.js';

class HistoryWriter {
  private timer: NodeJS.Timeout | null = null;
  private retentionTimer: NodeJS.Timeout | null = null;
  private lastWrittenTimestamps: Map<string, string> = new Map();
  private currentIntervalSeconds: number = env.HISTORY_INTERVAL_SECONDS || 60;

  public async start() {
    try {
      const dbSettings = await settingsRepo.getAll().catch(() => null);
      if (dbSettings?.historyIntervalSeconds && dbSettings.historyIntervalSeconds >= 5) {
        this.currentIntervalSeconds = dbSettings.historyIntervalSeconds;
      }
    } catch {
      // fallback
    }

    console.log(`⏱️ History writer started. Sampling interval: ${this.currentIntervalSeconds}s`);
    this.scheduleTimer();

    if (env.HISTORY_RETENTION_DAYS > 0) {
      console.log(`🧹 Data retention cleanup active: ${env.HISTORY_RETENTION_DAYS} days`);
      this.retentionTimer = setInterval(() => {
        this.runRetention();
      }, 3600 * 1000);
    }
  }

  public updateInterval(seconds: number) {
    if (seconds < 5 || seconds > 86400) return;
    this.currentIntervalSeconds = seconds;
    console.log(`⏱️ History writer interval dynamically updated: ${seconds}s`);
    this.scheduleTimer();
  }

  private scheduleTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.flushSample();
    }, this.currentIntervalSeconds * 1000);
  }

  public async flushSample() {
    const snapshots = liveStore.getAllSnapshots();

    for (const [meterId, snap] of Object.entries(snapshots)) {
      if (
        snap.connectionStatus !== 'online' ||
        snap.isStale ||
        !snap.values
      ) {
        // Skip writing offline, stale or empty samples
        continue;
      }

      // Skip if this exact sample timestamp was already written
      const lastTs = this.lastWrittenTimestamps.get(meterId);
      if (lastTs === snap.timestamp) {
        continue;
      }

      try {
        const inserted = await sampleRepo.insertSample(
          meterId,
          new Date(snap.timestamp),
          snap.source,
          snap.values
        );

        if (inserted) {
          this.lastWrittenTimestamps.set(meterId, snap.timestamp);
        }
      } catch (err) {
        console.error(`Failed to write historical sample for ${meterId}:`, err);
      }
    }
  }

  private async runRetention() {
    try {
      const deleted = await sampleRepo.deleteOlderThanDays(env.HISTORY_RETENTION_DAYS);
      if (deleted > 0) {
        console.log(`🧹 Retention cleanup: deleted ${deleted} historical sample records`);
      }
    } catch (err) {
      console.error('Failed to run retention cleanup:', err);
    }
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.retentionTimer) {
      clearInterval(this.retentionTimer);
      this.retentionTimer = null;
    }
  }
}

export const historyWriter = new HistoryWriter();
