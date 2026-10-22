import { Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { liveStore } from '../services/liveStore.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      db: 'disconnected',
      serverTime: new Date().toISOString(),
    });
    return;
  }

  const systemSnap = liveStore.getSystemSnapshot();

  res.status(200).json({
    success: true,
    status: 'healthy',
    db: dbStatus,
    systemStatus: systemSnap.systemStatus,
    sourceMode: systemSnap.sourceMode,
    activeAlarms: systemSnap.activeAlarmsCount,
    uptimeSeconds: Math.floor(process.uptime()),
    serverTime: new Date().toISOString(),
  });
}
