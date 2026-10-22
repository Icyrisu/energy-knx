import React from 'react';
import { Activity, PieChart as PieChartIcon, Zap } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { EChart, EChartsOption } from '../../components/ui/EChart';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { useTheme } from '../../hooks/useTheme';
import { formatNumber } from '../../lib/utils';

export const EnergySummaryCards: React.FC = () => {
  const { meters } = useLiveTelemetry();
  const { theme } = useTheme();

  const snapBesar = meters['kwh-besar'];
  const snapKecil = meters['kwh-kecil'];

  const energyBesar = snapBesar?.values?.totalKwh ?? 1374.0;
  const energyKecil = snapKecil?.values?.totalKwh ?? 874.0;

  const powerBesar = snapBesar?.values?.totalWatt ?? 6868.0;
  const powerKecil = snapKecil?.values?.totalWatt ?? 5902.0;

  const totalLivePower = Math.max(1, powerBesar + powerKecil);
  const ratioBesar = Math.round((powerBesar / totalLivePower) * 1000) / 10;
  const ratioKecil = Math.round((powerKecil / totalLivePower) * 1000) / 10;

  const isDark = theme === 'dark';

  const donutOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#18181b' : '#ffffff',
      borderColor: isDark ? '#27272a' : '#e2e8f0',
      textStyle: { color: isDark ? '#fafafa' : '#09090b', fontSize: 11 },
      formatter: '{b}: {c}%',
    },
    series: [
      {
        type: 'pie',
        radius: ['68%', '90%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: isDark ? '#141519' : '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: ratioBesar, name: 'KWH BESAR', itemStyle: { color: '#aef31e' } },
          { value: ratioKecil, name: 'KWH KECIL', itemStyle: { color: '#38bdf8' } },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Total Energy (kWh) */}
      <Card className="p-4 bg-white dark:bg-[#141519] border border-slate-200/80 dark:border-[#27272a] shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#aef31e]" />
          <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
            Energy Consumption
          </h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#aef31e]" />
              <span className="text-slate-500 dark:text-slate-400">KWH BESAR</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatNumber(energyBesar, 1)} <span className="text-[11px] font-normal text-slate-400">kWh</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              <span className="text-slate-500 dark:text-slate-400">KWH KECIL</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatNumber(energyKecil, 1)} <span className="text-[11px] font-normal text-slate-400">kWh</span>
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Total Power (W) */}
      <Card className="p-4 bg-white dark:bg-[#141519] border border-slate-200/80 dark:border-[#27272a] shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#aef31e]" />
          <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
            Active Power Demand
          </h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#aef31e]" />
              <span className="text-slate-500 dark:text-slate-400">KWH BESAR</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatNumber(powerBesar, 1)} <span className="text-[11px] font-normal text-slate-400">W</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              <span className="text-slate-500 dark:text-slate-400">KWH KECIL</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatNumber(powerKecil, 1)} <span className="text-[11px] font-normal text-slate-400">W</span>
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Power Ratio */}
      <Card className="p-4 bg-white dark:bg-[#141519] border border-slate-200/80 dark:border-[#27272a] shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <PieChartIcon className="w-4 h-4 text-slate-400" />
          <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
            Load Distribution
          </h4>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2 flex-1 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#aef31e]" />
                <span className="text-slate-500 dark:text-slate-400">BESAR</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{ratioBesar}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <span className="text-slate-500 dark:text-slate-400">KECIL</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{ratioKecil}%</span>
            </div>
          </div>

          <div className="w-16 h-16 shrink-0">
            <EChart option={donutOption} style={{ width: '100%', height: '100%', minHeight: '64px' }} />
          </div>
        </div>
      </Card>
    </div>
  );
};
