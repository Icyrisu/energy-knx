import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  KNOWN_METERS,
  MeterLiveSnapshot,
  SourceMode,
  SystemStatusSnapshot,
} from '@energy/shared';
import { api } from '../services/api';
import { wsClient, WsConnectionStatus } from '../services/websocket';

interface LiveTelemetryContextType {
  wsStatus: WsConnectionStatus;
  meters: Record<string, MeterLiveSnapshot>;
  systemStatus: 'healthy' | 'degraded' | 'offline';
  sourceMode: SourceMode | 'mixed' | 'off';
  activeAlarmsCount: number;
  lastUpdateTime: string | null;
  refresh: () => Promise<void>;
}

const LiveTelemetryContext = createContext<LiveTelemetryContextType | null>(null);

export function LiveTelemetryProvider({ children }: { children: React.ReactNode }) {
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>('disconnected');
  const [meters, setMeters] = useState<Record<string, MeterLiveSnapshot>>(() => {
    const initial: Record<string, MeterLiveSnapshot> = {};
    for (const [id, meta] of Object.entries(KNOWN_METERS)) {
      initial[id] = {
        meterId: id,
        meterName: meta.name,
        tag: meta.tag,
        connectionStatus: 'offline',
        source: 'simulation',
        timestamp: new Date().toISOString(),
        isStale: true,
        values: null,
      };
    }
    return initial;
  });

  const [systemStatus, setSystemStatus] = useState<'healthy' | 'degraded' | 'offline'>('offline');
  const [sourceMode, setSourceMode] = useState<SourceMode | 'mixed' | 'off'>('simulation');
  const [activeAlarmsCount, setActiveAlarmsCount] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  const applySnapshot = useCallback((snap: SystemStatusSnapshot) => {
    setSystemStatus(snap.systemStatus);
    setSourceMode(snap.sourceMode);
    setActiveAlarmsCount(snap.activeAlarmsCount);
    setLastUpdateTime(snap.serverTime);
    setMeters((prev) => ({
      ...prev,
      ...snap.meters,
    }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const snap = await api.getLatestSnapshot();
      applySnapshot(snap);
    } catch (err) {
      console.warn('Initial REST snapshot fetch failed:', err);
    }
  }, [applySnapshot]);

  useEffect(() => {
    // 1. Initial snapshot fetch via REST
    refresh();

    // 2. Connect WebSocket
    wsClient.connect();
    const unsubStatus = wsClient.onStatusChange((status) => {
      setWsStatus(status);
    });

    // 3. Listen to WebSocket events
    const unsubMsg = wsClient.onMessage((msg) => {
      if (msg.type === 'snapshot') {
        applySnapshot(msg.payload);
      } else if (msg.type === 'telemetry') {
        const snap = msg.payload;
        setLastUpdateTime(snap.timestamp);
        setMeters((prev) => ({
          ...prev,
          [snap.meterId]: snap,
        }));
      } else if (msg.type === 'meter-status') {
        const { meterId, status, isStale, timestamp } = msg.payload;
        setMeters((prev) => {
          const existing = prev[meterId];
          if (!existing) return prev;
          return {
            ...prev,
            [meterId]: {
              ...existing,
              connectionStatus: status,
              isStale,
              timestamp,
            },
          };
        });
      } else if (msg.type === 'alarm') {
        // Increment active alarm count or refresh
        setActiveAlarmsCount((c) => (msg.payload.status === 'active' ? c + 1 : Math.max(0, c - 1)));
      }
    });

    // 4. Client-side staleness fallback timer (checks if no sample received within 10s)
    const staleInterval = setInterval(() => {
      const now = Date.now();
      setMeters((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, m] of Object.entries(prev)) {
          if (!m.isStale && m.connectionStatus === 'online') {
            const age = now - new Date(m.timestamp).getTime();
            if (age > 10000) {
              next[id] = { ...m, isStale: true };
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => {
      unsubStatus();
      unsubMsg();
      clearInterval(staleInterval);
    };
  }, [applySnapshot, refresh]);

  const contextValue = React.useMemo(
    () => ({
      wsStatus,
      meters,
      systemStatus,
      sourceMode,
      activeAlarmsCount,
      lastUpdateTime,
      refresh,
    }),
    [wsStatus, meters, systemStatus, sourceMode, activeAlarmsCount, lastUpdateTime, refresh]
  );

  return (
    <LiveTelemetryContext.Provider value={contextValue}>
      {children}
    </LiveTelemetryContext.Provider>
  );
}

export function useLiveTelemetry(): LiveTelemetryContextType {
  const context = useContext(LiveTelemetryContext);
  if (!context) {
    throw new Error('useLiveTelemetry must be used within a LiveTelemetryProvider');
  }
  return context;
}
