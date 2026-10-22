import { Request, Response, Router } from 'express';
import {
  acknowledgeAlarm,
  getActiveAlarms,
  getAlarmHistory,
  getAlarmRules,
} from '../controllers/alarmsController.js';
import { getHealth } from '../controllers/healthController.js';
import { exportCsv, getHistory } from '../controllers/historyController.js';
import {
  getMeterById,
  getMeterLatest,
  getMeters,
  getMonitoringLatest,
} from '../controllers/monitoringController.js';
import { getSettings } from '../controllers/settingsController.js';
import { getTrends } from '../controllers/trendsController.js';
import { controlRouter } from './control.js';

export const apiRouter = Router();

// Guard against mutation in Demo Mode
const blockDemoMutation = (_req: Request, res: Response): void => {
  res.status(403).json({
    success: false,
    error: {
      code: 'DEMO_MODE_RESTRICTED',
      message: 'Modification of system configuration is disabled in Demo Mode.',
    },
  });
};

// Control (Two-way Modbus)
apiRouter.use('/control', controlRouter);

// System Health
apiRouter.get('/health', getHealth);

// Meters & Monitoring
apiRouter.get('/meters', getMeters);
apiRouter.get('/meters/:meterId', getMeterById);
apiRouter.patch('/meters/:meterId', blockDemoMutation);
apiRouter.get('/meters/:meterId/latest', getMeterLatest);
apiRouter.get('/monitoring/latest', getMonitoringLatest);

// Historical Data & CSV Export
apiRouter.get('/history/export.csv', exportCsv);
apiRouter.get('/history', getHistory);

// Trend Analytics
apiRouter.get('/trends', getTrends);

// Alarms
apiRouter.get('/alarms', getActiveAlarms);
apiRouter.get('/alarms/history', getAlarmHistory);
apiRouter.post('/alarms/:id/acknowledge', acknowledgeAlarm);
apiRouter.get('/alarms/rules', getAlarmRules);
apiRouter.put('/alarms/rules/:id', blockDemoMutation);

// Settings
apiRouter.get('/settings', getSettings);
apiRouter.put('/settings/:key', blockDemoMutation);
