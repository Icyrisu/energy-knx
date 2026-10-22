import { Request, Response } from 'express';
import { TelemetryBatchPayload } from '@energy/shared';
import { telemetryService } from '../services/telemetryService.js';

export async function ingestTelemetry(req: Request, res: Response): Promise<void> {
  const batch = req.body as TelemetryBatchPayload;
  const processed = await telemetryService.processBatch(batch);

  res.status(202).json({
    success: true,
    data: {
      accepted: processed,
      timestamp: new Date().toISOString(),
    },
  });
}
