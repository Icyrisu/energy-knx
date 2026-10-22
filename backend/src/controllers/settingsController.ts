import { Request, Response } from 'express';
import { settingsRepo } from '../repositories/settingsRepo.js';
import { historyWriter } from '../services/historyWriter.js';

export async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await settingsRepo.getAll();
  res.json({
    success: true,
    data: settings,
  });
}

export async function updateSetting(req: Request, res: Response): Promise<void> {
  const { key } = req.params;
  const { value } = req.body;

  try {
    await settingsRepo.update(key as any, value);
    if (key === 'historyIntervalSeconds' && typeof value === 'number') {
      historyWriter.updateInterval(value);
    }
    const updated = await settingsRepo.getAll();
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: (err as Error).message },
    });
  }
}
