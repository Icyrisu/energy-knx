import { Request, Response } from 'express';
import { meterRepo } from '../repositories/meterRepo.js';
import { liveStore } from '../services/liveStore.js';

export async function getMeters(_req: Request, res: Response): Promise<void> {
  const meters = await meterRepo.getAll();
  res.json({
    success: true,
    data: meters,
  });
}

export async function getMeterById(req: Request, res: Response): Promise<void> {
  const meter = await meterRepo.getById(req.params.meterId);
  if (!meter) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Meter "${req.params.meterId}" not found` },
    });
    return;
  }
  res.json({
    success: true,
    data: meter,
  });
}

export async function updateMeter(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body;
  const updated = await meterRepo.update(req.params.meterId, { name, description });
  if (!updated) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Meter "${req.params.meterId}" not found` },
    });
    return;
  }
  res.json({
    success: true,
    data: updated,
  });
}

export async function getMonitoringLatest(_req: Request, res: Response): Promise<void> {
  const snapshot = liveStore.getSystemSnapshot();
  res.json({
    success: true,
    data: snapshot,
  });
}

export async function getMeterLatest(req: Request, res: Response): Promise<void> {
  const snapshot = liveStore.getMeterSnapshot(req.params.meterId);
  if (!snapshot) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Meter "${req.params.meterId}" not found` },
    });
    return;
  }
  res.json({
    success: true,
    data: snapshot,
  });
}
