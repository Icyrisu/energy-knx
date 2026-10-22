import React from 'react';
import { Activity, Zap } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { formatNumber } from '../../lib/utils';
import { EnergySummaryCards } from './EnergySummaryCards';
import { MeterPanel } from './MeterPanel';
import { PowerTrendCard } from './PowerTrendCard';

export const DashboardPage: React.FC = () => {
  const { meters } = useLiveTelemetry();

  const meterBesar = meters['kwh-besar'] || {
    meterId: 'kwh-besar',
    meterName: 'Power Meter 1',
    tag: 'Meter 1',
    connectionStatus: 'offline',
    source: 'simulation',
    timestamp: new Date().toISOString(),
    isStale: true,
    values: null,
  };

  const meterKecil = meters['kwh-kecil'] || {
    meterId: 'kwh-kecil',
    meterName: 'Power Meter 2',
    tag: 'Meter 2',
    connectionStatus: 'offline',
    source: 'simulation',
    timestamp: new Date().toISOString(),
    isStale: true,
    values: null,
  };

  const totalWattBesar = meterBesar.values?.totalWatt ?? 0;
  const totalWattKecil = meterKecil.values?.totalWatt ?? 0;
  const combinedPower = totalWattBesar + totalWattKecil;

  const totalKwhBesar = meterBesar.values?.totalKwh ?? 0;
  const totalKwhKecil = meterKecil.values?.totalKwh ?? 0;
  const combinedEnergy = totalKwhBesar + totalKwhKecil;

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Top Row: Executive Stat Cards (Solid Clean Aesthetics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Total Real-Time Power */}
        <Card className="p-5 bg-white dark:bg-[#141519] border border-slate-200/80 dark:border-[#27272a] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Active Power
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-normal text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                {combinedPower > 0 ? formatNumber(combinedPower, 1) : '—'}
              </span>
              <span className="text-xs font-semibold text-slate-400">W</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#aef31e] text-black flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="w-6 h-6 text-black fill-black" />
          </div>
        </Card>

        {/* Card 2: Total Active Energy */}
        <Card className="p-5 bg-white dark:bg-[#141519] border border-slate-200/80 dark:border-[#27272a] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Active Energy
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-normal text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                {combinedEnergy > 0 ? formatNumber(combinedEnergy, 1) : '—'}
              </span>
              <span className="text-xs font-semibold text-slate-400">kWh</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Middle Row: Two 3-Phase Power Meters (28 Parameters) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <MeterPanel snapshot={meterBesar} />
        <MeterPanel snapshot={meterKecil} />
      </div>

      {/* Bottom Row: Power Trend Chart & Energy Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          <PowerTrendCard />
        </div>
        <div className="lg:col-span-1">
          <EnergySummaryCards />
        </div>
      </div>
    </div>
  );
};
