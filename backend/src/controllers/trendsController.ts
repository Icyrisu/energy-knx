import { Request, Response } from 'express';
import { ParameterKey } from '@energy/shared';
import { sampleRepo } from '../repositories/sampleRepo.js';

export async function getTrends(req: Request, res: Response): Promise<void> {
  const { meterIds, parameters, from, to, bucket } = req.query;

  if (!from || !to) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Missing "from" or "to" query parameter' },
    });
    return;
  }

  let meterIdList: string[] = [];
  if (typeof meterIds === 'string') {
    meterIdList = meterIds.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(meterIds)) {
    meterIdList = meterIds as string[];
  }
  if (meterIdList.length === 0) {
    meterIdList = ['kwh-besar', 'kwh-kecil'];
  }

  let paramList: ParameterKey[] = [];
  if (typeof parameters === 'string') {
    paramList = parameters.split(',').map((s) => s.trim()) as ParameterKey[];
  } else if (Array.isArray(parameters)) {
    paramList = parameters as ParameterKey[];
  }
  if (paramList.length === 0) {
    paramList = ['totalWatt'];
  }

  const result = await sampleRepo.getTrendSeries(
    meterIdList,
    paramList,
    from as string,
    to as string,
    typeof bucket === 'string' ? bucket : 'auto'
  );

  res.json({
    success: true,
    data: result,
  });
}
