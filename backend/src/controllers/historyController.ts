import { Request, Response } from 'express';
import { sampleRepo } from '../repositories/sampleRepo.js';

export async function getHistory(req: Request, res: Response): Promise<void> {
  const { meterId, from, to, page, pageSize } = req.query;

  const data = await sampleRepo.getHistory({
    meterId: typeof meterId === 'string' ? meterId : undefined,
    from: typeof from === 'string' ? from : undefined,
    to: typeof to === 'string' ? to : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : 50,
  });

  res.json({
    success: true,
    data: data.items,
    meta: {
      pagination: data.pagination,
    },
  });
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const { meterId, from, to } = req.query;

  const rows = await sampleRepo.queryCsvRows(
    typeof meterId === 'string' ? meterId : undefined,
    typeof from === 'string' ? from : undefined,
    typeof to === 'string' ? to : undefined
  );

  const filename = `energy_history_${meterId || 'all'}_${Date.now()}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // CSV Header
  const headers = [
    'Timestamp',
    'Meter ID',
    'Meter Name',
    'Source',
    'Voltage R (V)',
    'Voltage S (V)',
    'Voltage T (V)',
    'Current R (A)',
    'Current S (A)',
    'Current T (A)',
    'Watt R (W)',
    'Watt S (W)',
    'Watt T (W)',
    'KWH R (kWh)',
    'KWH S (kWh)',
    'KWH T (kWh)',
    'Total Watt (W)',
    'Total KWH (kWh)',
  ];

  res.write(headers.join(',') + '\r\n');

  for (const r of rows) {
    const line = [
      r.ts.toISOString(),
      `"${r.meter_id}"`,
      `"${r.meter_name || ''}"`,
      `"${r.source}"`,
      r.voltage_r,
      r.voltage_s,
      r.voltage_t,
      r.current_r,
      r.current_s,
      r.current_t,
      r.watt_r,
      r.watt_s,
      r.watt_t,
      r.kwh_r,
      r.kwh_s,
      r.kwh_t,
      r.total_watt,
      r.total_kwh,
    ].join(',');

    res.write(line + '\r\n');
  }

  res.end();
}
