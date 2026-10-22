import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useTheme } from '../../hooks/useTheme';

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
]);

export { echarts };
export type EChartsOption = echarts.EChartsCoreOption;
export type SeriesOption = any;

export interface EChartProps {
  option: echarts.EChartsCoreOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
}

export const EChart: React.FC<EChartProps> = ({ option, style, className, loading }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const instance = echarts.init(chartRef.current, theme === 'dark' ? 'dark' : undefined, {
      renderer: 'canvas',
    });
    chartInstance.current = instance;

    const resizeObserver = new ResizeObserver(() => {
      instance.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      instance.dispose();
      chartInstance.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (!chartInstance.current) return;

    if (loading) {
      chartInstance.current.showLoading({
        text: 'Loading...',
        color: '#2563EB',
        textColor: theme === 'dark' ? '#94A3B8' : '#64748B',
        maskColor: theme === 'dark' ? 'rgba(12, 21, 39, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      });
    } else {
      chartInstance.current.hideLoading();
      chartInstance.current.setOption(option, {
        notMerge: true,
        lazyUpdate: false,
      });
    }
  }, [option, loading, theme]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '100%', minHeight: '260px', ...style }}
      className={className}
    />
  );
};
