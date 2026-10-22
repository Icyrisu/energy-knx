import React, { memo } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { useLiveTelemetry } from '../../hooks/useLiveTelemetry';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({ onMobileMenuToggle }) => {
  const { wsStatus } = useLiveTelemetry();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/analytics':
      case '/trends':
      case '/history':
        return 'Analytics & History';
      case '/control':
        return 'Control';
      case '/settings':
        return 'Settings';
      default:
        return 'Energy Portal';
    }
  };

  const isConnected = wsStatus === 'connected';

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-[#222226] bg-white/90 dark:bg-[#131314]/90 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a1a1e] transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-[#797979] hidden sm:block">
            Electrical Power &amp; Energy Monitoring
          </p>
        </div>
      </div>

      {/* Right: Gateway Status & Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Connection Status Indicator */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs bg-white dark:bg-[#19191d] border border-slate-200 dark:border-[#26262b] shadow-xs"
          title={isConnected ? 'System Gateway is transmitting live telemetry' : 'System Gateway is disconnected'}
        >
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full shrink-0',
              isConnected ? 'bg-[#dbf059] shadow-xs shadow-[#dbf059]/50' : 'bg-rose-500'
            )}
          />
          <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg border border-slate-200 dark:border-[#26262b] hover:bg-slate-100 dark:hover:bg-[#1c1c20] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#dbf059]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );

});

Header.displayName = 'Header';
