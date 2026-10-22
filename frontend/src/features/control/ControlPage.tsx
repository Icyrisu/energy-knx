import React, { useEffect, useState } from 'react';
import {
  Lightbulb,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { formatDateTime } from '../../lib/utils';
import { api } from '../../services/api';
import { wsClient } from '../../services/websocket';
import { PendantLampCard } from './PendantLampCard';

interface ControlPointItem {
  tag: string;
  label: string;
  unitId: number;
  fc: number;
  address: number;
  type: 'bool' | 'int16' | 'uint16' | 'float32';
  scale?: number;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
}

interface ControlLogItem {
  id: number;
  ts: string;
  tag: string;
  value: number;
  success: boolean;
  error?: string | null;
}

const STORAGE_KEY = 'energy_lamp_states';

export const ControlPage: React.FC = () => {
  const [points, setPoints] = useState<ControlPointItem[]>([]);
  const [logs, setLogs] = useState<ControlLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [writingTag, setWritingTag] = useState<string | null>(null);

  // Initialize lamp states from localStorage so refresh never resets the state
  const [lampStates, setLampStates] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { 'lamp-1': false, 'lamp-2': false };
    } catch {
      return { 'lamp-1': false, 'lamp-2': false };
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pts, lg] = await Promise.all([
        api.getControlPoints().catch(() => []),
        api.getControlLogs().catch(() => []),
      ]);
      setPoints(pts);
      setLogs(lg);

      // Reconstruct last known lamp state from the NEWEST log only
      if (Array.isArray(lg) && lg.length > 0) {
        const seen = new Set<string>();
        const fromLatestLogs: Record<string, boolean> = {};

        for (const log of lg) {
          if (!seen.has(log.tag) && log.success) {
            seen.add(log.tag);
            fromLatestLogs[log.tag] = log.value === 1;
          }
        }

        setLampStates((prev) => {
          const next = { ...prev, ...fromLatestLogs };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Connect WebSocket and listen for real-time control updates across devices
    wsClient.connect();
    const unsub = wsClient.onMessage((msg) => {
      if (msg.type === 'control-update') {
        const { tag, value } = msg.payload;
        const isLampOn = Number(value) === 1 || value === true;
        setLampStates((prev) => {
          const next = { ...prev, [tag]: isLampOn };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });

        // Automatically fetch latest audit logs so table stays in sync across all devices
        api.getControlLogs().then(setLogs).catch(() => {});
      }
    });

    // 2. Failsafe auto-sync polling every 2s in case mobile network/browser sleeps WebSocket
    const syncInterval = setInterval(() => {
      api.getControlLogs().then((lg) => {
        if (Array.isArray(lg) && lg.length > 0) {
          setLogs(lg);
          const seen = new Set<string>();
          const fromLatestLogs: Record<string, boolean> = {};

          for (const log of lg) {
            if (!seen.has(log.tag) && log.success) {
              seen.add(log.tag);
              fromLatestLogs[log.tag] = log.value === 1;
            }
          }

          setLampStates((prev) => {
            let changed = false;
            for (const [k, v] of Object.entries(fromLatestLogs)) {
              if (prev[k] !== v) {
                changed = true;
                break;
              }
            }
            if (!changed) return prev;
            const next = { ...prev, ...fromLatestLogs };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      }).catch(() => {});
    }, 2000);

    return () => {
      unsub();
      clearInterval(syncInterval);
    };
  }, []);

  const handleToggleLamp = async (tag: string, nextState: boolean) => {
    setWritingTag(tag);
    try {
      await api.writeControlPoint(tag, nextState);
      
      // Update state and immediately persist to localStorage
      setLampStates((prev) => {
        const next = { ...prev, [tag]: nextState };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      // Refresh audit logs
      const latestLogs = await api.getControlLogs().catch(() => []);
      setLogs(latestLogs);
    } catch (err) {
      console.error('Failed to toggle lamp:', err);
    } finally {
      setWritingTag(null);
    }
  };

  // Lamp points (channel 1 and channel 2)
  const lampPoints = points.filter((p) => p.tag === 'lamp-1' || p.tag === 'lamp-2');
  const fallbackLamps: ControlPointItem[] = [
    {
      tag: 'lamp-1',
      label: 'Lamp 1',
      unitId: 1,
      fc: 5,
      address: 10,
      type: 'bool',
      description: 'Lamp 1 lighting circuit',
    },
    {
      tag: 'lamp-2',
      label: 'Lamp 2',
      unitId: 1,
      fc: 5,
      address: 11,
      type: 'bool',
      description: 'Lamp 2 lighting circuit',
    },
  ];
  const activeLamps = (lampPoints.length === 2 ? lampPoints : fallbackLamps).map((lamp) => ({
    ...lamp,
    label: lamp.tag === 'lamp-1' ? 'Lamp 1' : lamp.tag === 'lamp-2' ? 'Lamp 2' : lamp.label,
  }));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header & Status Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#27272a]">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Lighting Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Two-way device controls with real-time audit logging
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2 text-xs h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 2 Lamp Control Cards Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lighting Circuits (2 Channels)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeLamps.map((lamp, idx) => (
            <PendantLampCard
              key={lamp.tag}
              tag={lamp.tag}
              label={lamp.label}
              circuitLabel={`Circuit Channel ${idx + 1}`}
              isOn={Boolean(lampStates[lamp.tag])}
              isLoading={writingTag === lamp.tag}
              onToggle={handleToggleLamp}
            />
          ))}
        </div>
      </div>

      {/* Control Audit Log Section */}
      <Card className="bg-white dark:bg-[#141519] border-slate-200/80 dark:border-[#27272a] shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-[#27272a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <CardTitle className="text-sm font-semibold">Control Audit Trail</CardTitle>
            </div>
            <span className="text-xs text-slate-400">
              Last 50 operations
            </span>
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Verified audit trail of every device command executed on the system
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No control commands executed yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-[#27272a]">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-[#18181b]">
                  <TableRow>
                    <TableHead className="w-[180px] text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">Control Channel</TableHead>
                    <TableHead className="text-right text-xs">Command State</TableHead>
                    <TableHead className="w-[100px] text-center text-xs">Status</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-[#18181b]/50">
                      <TableCell className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {formatDateTime(log.ts)}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                        {log.tag === 'lamp-1' ? 'Lamp 1 (lamp-1)' : log.tag === 'lamp-2' ? 'Lamp 2 (lamp-2)' : log.tag}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {log.value === 1 ? '1 (ON)' : log.value === 0 ? '0 (OFF)' : log.value}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.success ? (
                          <Badge variant="success" className="text-[10px]">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px]">
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {log.error || 'Acknowledged'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
