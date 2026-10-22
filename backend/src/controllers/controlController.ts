import { Request, Response } from 'express';
import { controlRepo } from '../repositories/controlRepo.js';
import { noderedClient } from '../services/noderedClient.js';
import { wsServer } from '../websocket/wsServer.js';

export async function getControlPoints(_req: Request, res: Response): Promise<void> {
  const points = await noderedClient.getPoints();
  res.json({
    success: true,
    data: points,
  });
}

export async function writeControlPoint(req: Request, res: Response): Promise<void> {
  const { tag, value } = req.body as { tag: string; value: number | boolean };
  const numericVal = typeof value === 'boolean' ? (value ? 1 : 0) : Number(value);

  try {
    const result = await noderedClient.write(tag, value);
    await controlRepo.insertLog(tag, numericVal, true);

    // Broadcast in real-time to ALL connected WebSocket clients (phones, laptops, tablets)
    wsServer.broadcast({
      type: 'control-update',
      payload: {
        tag,
        value: numericVal,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      data: {
        tag,
        value,
        message: result.message,
      },
    });
  } catch (err) {
    const msg = (err as Error).message;
    await controlRepo.insertLog(tag, numericVal, false, msg);

    res.status(502).json({
      success: false,
      error: {
        code: 'MODBUS_WRITE_ERROR',
        message: msg,
      },
    });
  }
}

export async function getControlLogs(_req: Request, res: Response): Promise<void> {
  const logs = await controlRepo.getRecentLogs(50);
  res.json({
    success: true,
    data: logs,
  });
}
