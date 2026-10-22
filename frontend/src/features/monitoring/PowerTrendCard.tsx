import React, { useEffect, useState } from 'react';
import { echarts } from '../../components/ui/EChart';
import { TrendQueryResponse } from '@energy/shared';
import { Card } from '../../components/ui/card';
import { EChart, EChartsOption } from '../../components/ui/EChart';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

type TimeRangePreset = '1H' | '6H' | '24H' | '7D' | '30D';

export const PowerTrendCard: React.FC = () => {
  const [preset, setPreset] = useState<TimeRangePreset>('24H');
  const [trendData, setTrendData] = useState<TrendQueryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();

  useEffect(() => {
    let active = true;
    setLoading(true);

    const now = new Date();
    let fromDate = new Date(now.getTime() - 24 * 3600 * 1000);
    let bucket = '15m';

    if (preset === '1H') {
      fromDate = new Date(now.getTime() - 1 * 3600 * 1000);
      bucket = '1m';
    } else if (preset === '6H') {
      fromDate = new Date(now.getTime() - 6 * 3600 * 1000);
      bucket = '5m';
    } else if (preset === '24H') {
      fromDate = new Date(now.getTime() - 24 * 3600 * 1000);
      bucket = '15m';
    } else if (preset === '7D') {
      fromDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      bucket = '1h';
    } else if (preset === '30D') {
      fromDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      bucket = '1d';
    }

    api
      .getTrends(
        ['kwh-besar', 'kwh-kecil'],
        ['totalWatt'],
        fromDate.toISOString(),
        now.toISOString(),
        bucket
      )
      .then((res) => {
        if (active) {
          setTrendData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load power trends:', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [preset]);

  const seriesBesar = trendData?.series.find((s) => s.meterId === 'kwh-besar');
  const seriesKecil = trendData?.series.find((s) => s.meterId === 'kwh-kecil');

  const timestamps = seriesBesar?.data.map((d) => d.timestamp) || [];
  const xLabels = timestamps.map((ts) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  const isDark = theme === 'dark';
  const gridLineColor = isDark ? '#27272a' : '#f1f5f9';
  const textColor = isDark ? '#a1a1aa' : '#64748b';

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#18181b' : '#ffffff',
      borderColor: isDark ? '#27272a' : '#e2e8f0',
      textStyle: {
        color: isDark ? '#fafafa' : '#09090b',
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: isDark ? '#3f3f46' : '#cbd5e1',
          type: 'dashed',
        },
      },
    },
    grid: {
      top: '12%',
      left: '2%',
      right: '2%',
      bottom: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xLabels.length > 0 ? xLabels : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      axisLine: { lineStyle: { color: gridLineColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: (val: number) => val.toLocaleString(),
      },
      splitLine: {
        lineStyle: {
          color: gridLineColor,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: 'Power Meter 1',
        type: 'line',
        smooth: 0.3,
        showSymbol: false,
        data: seriesBesar?.data.map((d) => d.value ?? 0) || [2800, 3100, 2900, 3800, 4600, 5800, 6868],
        itemStyle: { color: '#2f31f5' },
        lineStyle: { width: 2.5, color: '#2f31f5' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(47, 49, 245, 0.35)' },
            { offset: 1, color: 'rgba(47, 49, 245, 0.0)' },
          ]),
        },
      },
      {
        name: 'Power Meter 2',
        type: 'line',
        smooth: 0.3,
        showSymbol: false,
        data: seriesKecil?.data.map((d) => d.value ?? 0) || [1800, 1600, 1900, 2400, 2800, 3900, 5902],
        itemStyle: { color: '#dbf059' },
        lineStyle: { width: 2.5, color: '#dbf059' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(218, 240, 89, 0.28)' },
            { offset: 1, color: 'rgba(218, 240, 89, 0.0)' },
          ]),
        },
      },
    ],
  };

  const presets: TimeRangePreset[] = ['1H', '6H', '24H', '7D', '30D'];

  return (
    <Card className="p-5 sm:p-6 bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-[#26262b] shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#26262b]">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-[#ffffff] tracking-tight">
            Power Trend
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#797979]">
            Active Power (W) — {preset === '24H' ? 'Last 24 Hours' : `Last ${preset}`}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2f31f5] shadow-xs shadow-[#2f31f5]/40" />
              <span>Power Meter 1</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dbf059] shadow-xs shadow-[#dbf059]/40" />
              <span>Power Meter 2</span>
            </div>
          </div>

          {/* Time range preset buttons */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#131314] border border-slate-200/80 dark:border-[#26262b]">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  preset === p
                    ? 'bg-[#2f31f5] text-white shadow-xs'
                    : 'text-slate-500 dark:text-[#797979] hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Chart container */}
      <div className="h-64 sm:h-72 mt-2 w-full">
        <EChart option={option} loading={loading} />
      </div>
    </Card>
  );
};
