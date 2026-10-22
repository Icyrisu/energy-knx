import { Request, Response, Router } from 'express';
import {
  acknowledgeAlarm,
  getActiveAlarms,
  getAlarmHistory,
  getAlarmRules,
  updateAlarmRule,
} from '../controllers/alarmsController.js';
import { getHealth } from '../controllers/healthController.js';
import { exportCsv, getHistory } from '../controllers/historyController.js';
import {
  getMeterById,
  getMeterLatest,
  getMeters,
  getMonitoringLatest,
  updateMeter,
} from '../controllers/monitoringController.js';
import { getSettings, updateSetting } from '../controllers/settingsController.js';
import { getTrends } from '../controllers/trendsController.js';
import { controlRouter } from './control.js';

export const apiRouter = Router();

// Control (Two-way Modbus)
apiRouter.use('/control', controlRouter);

// System Health
apiRouter.get('/health', getHealth);

// Meters & Monitoring
apiRouter.get('/meters', getMeters);
apiRouter.get('/meters/:meterId', getMeterById);
apiRouter.patch('/meters/:meterId', updateMeter);
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
apiRouter.put('/alarms/rules/:id', updateAlarmRule);

// Settings
apiRouter.get('/settings', getSettings);
apiRouter.put('/settings/:key', updateSetting);

