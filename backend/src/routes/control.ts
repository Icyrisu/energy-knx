import { Router } from 'express';
import { controlWriteSchema } from '@energy/shared';
import {
  getControlLogs,
  getControlPoints,
  writeControlPoint,
} from '../controllers/controlController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';

export const controlRouter = Router();

// Protect control write endpoint against flood / relay chatter attacks
const controlWriteLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 writes per minute per IP
  message: 'Device control rate limit exceeded. Please wait a moment before sending more commands.',
});

controlRouter.get('/points', getControlPoints);
controlRouter.post('/write', controlWriteLimiter, validateBody(controlWriteSchema), writeControlPoint);
controlRouter.get('/logs', getControlLogs);
