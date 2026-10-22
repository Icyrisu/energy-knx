import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LineChart,
  RefreshCw,
  Table as TableIcon,
} from 'lucide-react';
import {
  HistoricalSampleRow,
  METER_PARAMETERS,
  PaginationMeta,
  ParameterKey,
  TrendQueryResponse,
} from '@energy/shared';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { echarts, EChart, EChartsOption, SeriesOption } from '../../components/ui/EChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useTheme } from '../../hooks/useTheme';
import { cn, formatDateTime, formatNumber } from '../../lib/utils';
import { api } from '../../services/api';

type TimeRangePreset = '1h' | '6h' | '24h' | '7d' | '30d';

export const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();

  // --- Trend Section State ---
  const [selectedMeters, setSelectedMeters] = useState<string[]>(['kwh-besar', 'kwh-kecil']);
  const [selectedParams, setSelectedParams] = useState<ParameterKey[]>(['totalWatt']);
  const [trendPreset, setTrendPreset] = useState<TimeRangePreset>('24h');
  const [trendData, setTrendData] = useState<TrendQueryResponse | null>(null);
  const [trendLoading, setTrendLoading] = useState<boolean>(true);

  // --- History Table Section State ---
  const [historyMeterId, setHistoryMeterId] = useState<string>('');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyPageSize] = useState<number>(20);
  const [historyItems, setHistoryItems] = useState<HistoricalSampleRow[]>([]);
  const [historyPagination, setHistoryPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);

  // 1. Fetch Trend Analytics
  const fetchTrends = () => {
    setTrendLoading(true);
    const now = new Date();
    let from = new Date(now.getTime() - 24 * 3600 * 1000);
    let bucket = '15m';

    if (trendPreset === '1h') {
      from = new Date(now.getTime() - 3600 * 1000);
      bucket = '1m';
    } else if (trendPreset === '6h') {
      from = new Date(now.getTime() - 6 * 3600 * 1000);
      bucket = '5m';
    } else if (trendPreset === '24h') {
      from = new Date(now.getTime() - 24 * 3600 * 1000);
      bucket = '15m';
    } else if (trendPreset === '7d') {
      from = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      bucket = '1h';
    } else if (trendPreset === '30d') {
      from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      bucket = '1d';
    }

    api
      .getTrends(selectedMeters, selectedParams, from.toISOString(), now.toISOString(), bucket)
      .then((res) => {
        setTrendData(res);
        setTrendLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load trends:', err);
        setTrendLoading(false);
      });
  };

  // 2. Fetch Historical Log Table
  const fetchHistory = () => {
    setHistoryLoading(true);
    api
      .getHistory({
        meterId: historyMeterId || undefined,
        page: historyPage,
        pageSize: historyPageSize,
      })
      .then((res) => {
        setHistoryItems(res.items);
        setHistoryPagination(res.pagination);
        setHistoryLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
        setHistoryLoading(false);
      });
  };

  useEffect(() => {
    fetchTrends();
  }, [selectedMeters, selectedParams, trendPreset]);

  useEffect(() => {
    fetchHistory();
  }, [historyMeterId, historyPage]);

  const toggleMeter = (id: string) => {
    setSelectedMeters((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((m) => m !== id) : prev) : [...prev, id]
    );
  };

  const toggleParam = (key: ParameterKey) => {
    setSelectedParams((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]
    );
  };

  const handleExportCsv = () => {
    const url = api.getExportCsvUrl(historyMeterId || undefined);
    window.open(url, '_blank');
  };

  // --- Prepare ECharts Option ---
  const isDark = theme === 'dark';
  const gridLineColor = isDark ? '#26262b' : '#ebebe9';
  const textColor = isDark ? '#797979' : '#64748b';

  const palette = ['#2f31f5', '#dbf059', '#38bdf8', '#fbbf24', '#f87171', '#34d399'];
  const areaPalette = [
    { start: 'rgba(47, 49, 245, 0.35)', end: 'rgba(47, 49, 245, 0.0)' },
    { start: 'rgba(218, 240, 89, 0.30)', end: 'rgba(218, 240, 89, 0.0)' },
    { start: 'rgba(56, 189, 248, 0.25)', end: 'rgba(56, 189, 248, 0.0)' },
    { start: 'rgba(251, 191, 36, 0.25)', end: 'rgba(251, 191, 36, 0.0)' },
    { start: 'rgba(248, 113, 113, 0.25)', end: 'rgba(248, 113, 113, 0.0)' },
    { start: 'rgba(52, 211, 153, 0.25)', end: 'rgba(52, 211, 153, 0.0)' },
  ];


  const allTimestamps = Array.from(
    new Set(trendData?.series.flatMap((s) => s.data.map((d) => d.timestamp)) || [])
  ).sort();

  const xLabels = allTimestamps.map((ts) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  const chartSeries: SeriesOption[] =
    trendData?.series.map((s, idx) => {
      const color = palette[idx % palette.length];
      const area = areaPalette[idx % areaPalette.length];
      const dataMap = new Map(s.data.map((d) => [d.timestamp, d.value]));

      return {
        name: `${s.meterId === 'kwh-besar' ? 'Power Meter 1' : 'Power Meter 2'} · ${s.parameter} (${s.unit})`,
        type: 'line',
        smooth: 0.3,
        showSymbol: allTimestamps.length <= 2,
        symbolSize: 6,
        data: allTimestamps.map((ts) => dataMap.get(ts) ?? null),
        itemStyle: { color },
        lineStyle: { width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: area.start },
            { offset: 1, color: area.end },
          ]),
        },
      };
    }) || [];

  const chartOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: isDark ? '#18181b' : '#ffffff',
      borderColor: isDark ? '#27272a' : '#e2e8f0',
      textStyle: { color: isDark ? '#fafafa' : '#09090b', fontSize: 12 },
    },
    legend: {
      show: true,
      top: 0,
      textStyle: { color: textColor, fontSize: 11 },
    },
    grid: {
      top: '16%',
      left: '2%',
      right: '2%',
      bottom: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: gridLineColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11 },
      splitLine: { lineStyle: { color: gridLineColor, type: 'dashed' } },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 18,
        bottom: 5,
        borderColor: 'transparent',
        backgroundColor: isDark ? '#141519' : '#f8fafc',
        fillerColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
        textStyle: { color: textColor, fontSize: 10 },
      },
    ],
    series: chartSeries,
  };

  const primaryParams: ParameterKey[] = [
    'totalWatt',
    'totalKwh',
    'voltageR',
    'voltageS',
    'voltageT',
    'currentR',
    'currentS',
    'currentT',
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* 1. Interactive Trend View Section */}
      <Card className="p-5 sm:p-6 bg-white dark:bg-[#141519] border-slate-200/80 dark:border-[#27272a] shadow-xs">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center justify-center">
              <LineChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Trend Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparative time-series visualization across power meters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Meter Selectors */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleMeter('kwh-besar')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                  selectedMeters.includes('kwh-besar')
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                    : 'bg-transparent text-slate-400 border-slate-200 dark:border-zinc-800'
                )}
              >
                Power Meter 1
              </button>
              <button
                onClick={() => toggleMeter('kwh-kecil')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                  selectedMeters.includes('kwh-kecil')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-transparent text-slate-400 border-slate-200 dark:border-zinc-800'
                )}
              >
                Power Meter 2
              </button>
            </div>

            {/* Time Presets */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#1f2024] border border-slate-200/80 dark:border-[#27272a]">
              {(['1h', '6h', '24h', '7d', '30d'] as TimeRangePreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setTrendPreset(p)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium uppercase transition-all cursor-pointer',
                    trendPreset === p
                      ? 'bg-white dark:bg-[#27272a] text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchTrends}
              disabled={trendLoading}
              className="h-8 px-2.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', trendLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Parameter Chips */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Parameters:
          </span>
          {primaryParams.map((key) => {
            const paramDef = METER_PARAMETERS.find((p) => p.key === key);
            const isSelected = selectedParams.includes(key);

            return (
              <button
                key={key}
                onClick={() => toggleParam(key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 transition-all cursor-pointer',
                  isSelected
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent font-semibold'
                    : 'bg-slate-50 dark:bg-[#18181b] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#27272a] hover:bg-slate-100 dark:hover:bg-zinc-800'
                )}
              >
                {paramDef?.label || key}
              </button>
            );
          })}
        </div>

        {/* EChart Container with Empty Guard */}
        <div className="h-80 sm:h-96 w-full mt-2 relative">
          {allTimestamps.length === 0 && !trendLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <LineChart className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                No telemetry recorded for the selected {trendPreset.toUpperCase()} window
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ensure telemetry logging is active or select a wider time range preset
              </p>
            </div>
          ) : (
            <EChart option={chartOption} loading={trendLoading} />
          )}
        </div>
      </Card>

      {/* 2. Granular Historical Data Table Section */}
      <Card className="p-5 sm:p-6 bg-white dark:bg-[#141519] border-slate-200/80 dark:border-[#27272a] shadow-xs space-y-4">
        {/* Table Filter Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center justify-center">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Historical Telemetry Logs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Periodic snapshots recorded and persisted in PostgreSQL database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Meter Filter */}
            <select
              value={historyMeterId}
              onChange={(e) => {
                setHistoryMeterId(e.target.value);
                setHistoryPage(1);
              }}
              className="bg-slate-100 dark:bg-[#1f2024] border border-slate-200 dark:border-[#27272a] rounded-lg text-xs font-semibold px-3 py-1.5 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="">All Meters</option>
              <option value="kwh-besar">Power Meter 1</option>
              <option value="kwh-kecil">Power Meter 2</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#27272a]">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-[#18181b]">
              <TableRow>
                <TableHead className="w-[160px] text-xs">Timestamp</TableHead>
                <TableHead className="w-[120px] text-xs">Meter</TableHead>
                <TableHead className="text-right text-xs">Voltage R (V)</TableHead>
                <TableHead className="text-right text-xs">Voltage S (V)</TableHead>
                <TableHead className="text-right text-xs">Voltage T (V)</TableHead>
                <TableHead className="text-right text-xs">Current R (A)</TableHead>
                <TableHead className="text-right text-xs">Current S (A)</TableHead>
                <TableHead className="text-right text-xs">Current T (A)</TableHead>
                <TableHead className="text-right text-xs">Watt R (W)</TableHead>
                <TableHead className="text-right text-xs">Watt S (W)</TableHead>
                <TableHead className="text-right text-xs">Watt T (W)</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Total Watt (W)
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Total kWh
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-28 text-center text-xs text-slate-400">
                    Loading historical records...
                  </TableCell>
                </TableRow>
              ) : historyItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-28 text-center text-xs text-slate-400">
                    No historical telemetry records found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                historyItems.map((row) => (
                  <TableRow key={`${row.meterId}-${row.timestamp}`} className="hover:bg-slate-50/50 dark:hover:bg-[#18181b]/50">
                    <TableCell className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDateTime(row.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-200">
                      {row.meterId === 'kwh-besar' ? 'Power Meter 1' : 'Power Meter 2'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.voltageR, 1)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.voltageS, 1)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.voltageT, 1)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.currentR, 1)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.currentS, 1)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.currentT, 1)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.wattR, 0)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.wattS, 0)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(row.wattT, 0)}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatNumber(row.totalWatt, 1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatNumber(row.totalKwh, 1)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Page <strong className="text-slate-800 dark:text-slate-200">{historyPagination.page}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{historyPagination.totalPages}</strong> ({historyPagination.totalItems} records total)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={historyPage >= historyPagination.totalPages}
              onClick={() => setHistoryPage((p) => p + 1)}
              className="h-8 px-2.5"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
