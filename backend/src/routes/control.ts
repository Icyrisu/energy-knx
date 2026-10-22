import { Router } from 'express';
import { controlWriteSchema } from '@energy/shared';
import {
  getControlLogs,
  getControlPoints,
  writeControlPoint,
} from '../controllers/controlController.js';
import { validateBody } from '../middleware/validate.js';

export const controlRouter = Router();

controlRouter.get('/points', getControlPoints);
controlRouter.post('/write', validateBody(controlWriteSchema), writeControlPoint);
controlRouter.get('/logs', getControlLogs);
