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
        'flex-1 p-4 rounded-xl border border-slate-200/80 dark:border-[#27272a] bg-slate-50/80 dark:bg-[#18181b] flex items-center gap-3.5 transition-all',
        (isStale || isOffline) && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs',
          isWatt
            ? 'bg-[#aef31e] text-black'
            : 'bg-black dark:bg-white text-white dark:text-black'
        )}
      >
        {isWatt ? <Zap className="w-5 h-5 text-black fill-black" /> : <Activity className="w-5 h-5 text-current" />}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
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
