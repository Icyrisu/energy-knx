import React from 'react';
import { Activity, Zap } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

interface TotalTileProps {
  type: 'watt' | 'kwh';
  value: number | null | undefined;
  isStale?: boolean;
  isOffline?: boolean;
}

export const TotalTile: React.FC<TotalTileProps> = ({
  type,
  value,
  isStale = false,
  isOffline = false,
}) => {
  const isWatt = type === 'watt';
  const label = isWatt ? 'Total Power' : 'Total Energy';
  const unit = isWatt ? 'W' : 'kWh';

  return (
    <div
      className={cn(
        'flex-1 p-4 rounded-xl border border-slate-200/80 dark:border-[#26262b] bg-slate-50/80 dark:bg-[#19191d] flex items-center gap-3.5 transition-all',
        (isStale || isOffline) && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
          isWatt
            ? 'bg-[#2f31f5] text-white shadow-sm shadow-[#2f31f5]/25'
            : 'bg-[#dbf059] text-[#131314] shadow-sm shadow-[#dbf059]/25'
        )}
      >
        {isWatt ? <Zap className="w-5 h-5 text-[#dbf059] fill-[#dbf059]" /> : <Activity className="w-5 h-5 text-[#131314]" />}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-[#797979] block">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xl sm:text-2xl font-normal tracking-tight text-slate-900 dark:text-[#ffffff] tabular-nums">

            {isOffline ? '—' : formatNumber(value, 1)}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
};
