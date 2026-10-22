import { TelemetryBatchPayload } from '@energy/shared';
import { alarmService } from './alarmService.js';
import { liveStore } from './liveStore.js';

export const telemetryService = {
  async processBatch(batch: TelemetryBatchPayload): Promise<number> {
    let processed = 0;

    for (const reading of batch.readings) {
      const snapshot = liveStore.updateReading(reading);
      processed++;

      // Asynchronously evaluate alarms without blocking telemetry ingestion
      alarmService.evaluateSnapshot(snapshot).catch((err) => {
        console.error(`Error evaluating alarms for meter ${reading.meterId}:`, err);
      });
    }

    return processed;
  },
};
