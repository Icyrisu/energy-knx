import React from 'react';
import { MeterParameterDefinition } from '@energy/shared';
import { cn, formatNumber } from '../../lib/utils';

interface ParameterTileProps {
  param: MeterParameterDefinition;
  value: number | null | undefined;
  isStale?: boolean;
  isOffline?: boolean;
}

const ParameterTileComponent: React.FC<ParameterTileProps> = ({
  param,
  value,
  isStale = false,
  isOffline = false,
}) => {
  const isKwh = param.group === 'energy';

  let phaseBadgeClass = 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700';
  if (isKwh) {
    phaseBadgeClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  } else if (param.phase === 'R') {
    phaseBadgeClass = 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
  } else if (param.phase === 'S') {
    phaseBadgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  } else if (param.phase === 'T') {
    phaseBadgeClass = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
  }

  return (
    <div
      className={cn(
        'p-3 rounded-xl border border-slate-200/80 dark:border-[#27272a] bg-slate-50/70 dark:bg-[#18181b] flex flex-col justify-between transition-colors',
        (isStale || isOffline) && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-2">
        {param.phase && (
          <span
            className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0',
              phaseBadgeClass
            )}
          >
            {param.phase}
          </span>
        )}
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
          {param.label}
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-1">
        <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
          {isOffline ? '—' : formatNumber(value, param.decimals)}
        </span>
        <span className="text-[11px] font-medium text-slate-400">
          {param.unit}
        </span>
      </div>
    </div>
  );
};

export const ParameterTile = React.memo(ParameterTileComponent);
