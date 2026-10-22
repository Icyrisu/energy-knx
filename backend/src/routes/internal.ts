import { Router } from 'express';
import { telemetryBatchSchema } from '@energy/shared';
import { ingestTelemetry } from '../controllers/telemetryController.js';
import { internalAuthMiddleware } from '../middleware/internalAuth.js';
import { validateBody } from '../middleware/validate.js';

export const internalRouter = Router();

// Internal telemetry endpoint used by Node-RED (authenticated with X-Internal-Secret)
internalRouter.post(
  '/telemetry',
  internalAuthMiddleware,
  validateBody(telemetryBatchSchema),
  ingestTelemetry
);
