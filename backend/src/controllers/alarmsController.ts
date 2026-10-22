import { Request, Response } from 'express';
import { alarmRepo } from '../repositories/alarmRepo.js';
import { alarmService } from '../services/alarmService.js';

export async function getActiveAlarms(_req: Request, res: Response): Promise<void> {
  const alarms = await alarmRepo.getActiveAlarms();
  res.json({
    success: true,
    data: alarms,
  });
}

export async function getAlarmHistory(req: Request, res: Response): Promise<void> {
  const { status, meterId, from, to, page, pageSize } = req.query;

  const result = await alarmRepo.getAlarmHistory({
    status: typeof status === 'string' ? status : undefined,
    meterId: typeof meterId === 'string' ? meterId : undefined,
    from: typeof from === 'string' ? from : undefined,
    to: typeof to === 'string' ? to : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : 50,
  });

  res.json({
    success: true,
    data: result.items,
    meta: {
      total: result.total,
      page: page ? parseInt(page as string, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : 50,
    },
  });
}

export async function acknowledgeAlarm(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Invalid alarm ID' },
    });
    return;
  }

  const success = await alarmRepo.acknowledge(id);
  res.json({
    success,
    data: { id, acknowledged: success },
  });
}

export async function getAlarmRules(_req: Request, res: Response): Promise<void> {
  const rules = await alarmRepo.getRules();
  res.json({
    success: true,
    data: rules,
  });
}

export async function updateAlarmRule(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Invalid rule ID' },
    });
    return;
  }

  const updated = await alarmRepo.updateRule(id, req.body);
  if (!updated) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Rule #${id} not found` },
    });
    return;
  }

  // Refresh active rules in service
  await alarmService.refreshRules();

  res.json({
    success: true,
    data: updated,
  });
}
