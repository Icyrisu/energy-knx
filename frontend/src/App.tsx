import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LiveTelemetryProvider } from './hooks/useLiveTelemetry';
import { ThemeProvider } from './hooks/useTheme';

const DashboardPage = lazy(() =>
  import('./features/monitoring/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const AnalyticsPage = lazy(() =>
  import('./features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const ControlPage = lazy(() =>
  import('./features/control/ControlPage').then((m) => ({ default: m.ControlPage }))
);

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[360px] text-xs text-slate-400">
    <div className="flex flex-col items-center gap-2">
      <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LiveTelemetryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="analytics"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              {/* Redirects for consolidated pages */}
              <Route path="trends" element={<Navigate to="/analytics" replace />} />
              <Route path="history" element={<Navigate to="/analytics" replace />} />
              <Route path="alarms" element={<Navigate to="/settings" replace />} />

              <Route
                path="control"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ControlPage />
                  </Suspense>
                }
              />
              {/* Lock out Settings in Web Demo Mode */}
              <Route path="settings" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LiveTelemetryProvider>
    </ThemeProvider>
  );
};
