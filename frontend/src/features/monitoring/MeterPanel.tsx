import React from 'react';
import { Cpu } from 'lucide-react';
import { MeterLiveSnapshot, METER_PARAMETERS, ParameterKey } from '@energy/shared';
import { Card } from '../../components/ui/card';
import { ParameterTile } from './ParameterTile';
import { TotalTile } from './TotalTile';

interface MeterPanelProps {
  snapshot: MeterLiveSnapshot;
}

const MeterPanelComponent: React.FC<MeterPanelProps> = ({ snapshot }) => {
  const isOffline = snapshot.connectionStatus !== 'online' || !snapshot.values;
  const isStale = snapshot.isStale;

  // Group parameters into 4 columns (R, S, T, and KWH)
  const colR = METER_PARAMETERS.filter((p) => 'phase' in p && p.phase === 'R' && p.group !== 'energy');
  const colS = METER_PARAMETERS.filter((p) => 'phase' in p && p.phase === 'S' && p.group !== 'energy');
  const colT = METER_PARAMETERS.filter((p) => 'phase' in p && p.phase === 'T' && p.group !== 'energy');
  const colKwh = METER_PARAMETERS.filter((p) => p.group === 'energy');

  return (
    <Card className="p-5 sm:p-6 bg-white dark:bg-[#141519] border-slate-200/80 dark:border-[#27272a] shadow-xs flex flex-col justify-between">
      {/* Header without loud badges */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#27272a] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
              {snapshot.meterName}
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              {snapshot.tag}
            </span>
          </div>
        </div>

        {/* Minimal indicator if offline/stale */}
        {isOffline && (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            No data
          </span>
        )}
      </div>

      {/* 4-Columns Grid of Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1">
        {/* Column 1: Phase R */}
        <div className="space-y-2.5">
          {colR.map((param) => (
            <ParameterTile
              key={param.key}
              param={param}
              value={snapshot.values?.[param.key as ParameterKey]}
              isStale={isStale}
              isOffline={isOffline}
            />
          ))}
        </div>

        {/* Column 2: Phase S */}
        <div className="space-y-2.5">
          {colS.map((param) => (
            <ParameterTile
              key={param.key}
              param={param}
              value={snapshot.values?.[param.key as ParameterKey]}
              isStale={isStale}
              isOffline={isOffline}
            />
          ))}
        </div>

        {/* Column 3: Phase T */}
        <div className="space-y-2.5">
          {colT.map((param) => (
            <ParameterTile
              key={param.key}
              param={param}
              value={snapshot.values?.[param.key as ParameterKey]}
              isStale={isStale}
              isOffline={isOffline}
            />
          ))}
        </div>

        {/* Column 4: Phase kWh (Energy) */}
        <div className="space-y-2.5">
          {colKwh.map((param) => (
            <ParameterTile
              key={param.key}
              param={param}
              value={snapshot.values?.[param.key as ParameterKey]}
              isStale={isStale}
              isOffline={isOffline}
            />
          ))}
        </div>
      </div>

      {/* Bottom Summary: Total Watt and Total kWh */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#27272a] flex flex-col sm:flex-row gap-3">
        <TotalTile
          type="watt"
          value={snapshot.values?.totalWatt}
          isStale={isStale}
          isOffline={isOffline}
        />
        <TotalTile
          type="kwh"
          value={snapshot.values?.totalKwh}
          isStale={isStale}
          isOffline={isOffline}
        />
      </div>
    </Card>
  );
};

export const MeterPanel = React.memo(MeterPanelComponent);
