import React, { memo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sliders,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = memo(({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const showDesktopExpanded = !isCollapsed || isHovered;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Control', path: '/control', icon: Sliders },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const renderContent = (isMobileView: boolean) => {
    const showExpanded = isMobileView ? true : showDesktopExpanded;
    return (
      <div className="flex flex-col h-full bg-[#131314] text-[#797979] select-none border-r border-[#222226] transition-colors">
        {/* Brand Header */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-[#222226] transition-all duration-200',
            showExpanded ? 'justify-between px-4' : 'justify-center px-0'
          )}
        >
        {showExpanded ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#2f31f5] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#2f31f5]/25">
                <Zap className="w-5 h-5 text-[#dbf059] fill-[#dbf059]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-[#ffffff] tracking-tight leading-none truncate">
                  Energy Portal
                </span>
                <span className="text-[11px] text-[#797979] font-medium truncate mt-1">
                  Power &amp; Energy
                </span>
              </div>
            </div>

            {/* Desktop Pin / Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-[#797979] hover:text-white hover:bg-[#1a1a1e] transition-colors cursor-pointer"
              title={isCollapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#dbf059]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </>
        ) : (
          /* Strictly Collapsed: Only Single Centered Brand Icon */
          <button
            onClick={onToggleCollapse}
            title="Click to expand sidebar"
            className="w-10 h-10 rounded-xl bg-[#2f31f5] text-white flex items-center justify-center shrink-0 hover:bg-[#2527cc] transition-all cursor-pointer shadow-sm shadow-[#2f31f5]/25"
          >
            <Zap className="w-5 h-5 text-[#dbf059] fill-[#dbf059]" />
          </button>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-[#797979] hover:text-white hover:bg-[#1a1a1e] transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden">
        <div>
          {showExpanded && (
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-[#797979] uppercase">
              Navigation
            </div>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onMobileClose}
                title={!showExpanded ? item.name : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer',
                    isActive
                      ? 'bg-[#1f2028] text-white shadow-xs'
                      : 'text-[#797979] hover:text-white hover:bg-[#17171b]',
                    !showExpanded ? 'justify-center px-0' : ''
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-[#dbf059]' : 'text-[#797979] group-hover:text-white'
                      )}
                    />
                    {showExpanded && (
                      <span className="truncate">{item.name}</span>
                    )}
                    {isActive && showExpanded && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[#dbf059]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      {showExpanded && (
        <div className="p-3 border-t border-[#222226] text-[11px] text-[#797979] px-4">
          Power &amp; Energy Monitoring
        </div>
      )}
    </div>
  );
};

  return (
    <>
      {/* Desktop Sidebar with Smooth Hover Expansion */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        className={cn(
          'hidden lg:flex flex-col shrink-0 min-h-screen transition-[width] duration-250 ease-in-out z-40 sticky top-0 h-screen',
          showDesktopExpanded ? 'w-64' : 'w-20',
          isCollapsed && isHovered && 'shadow-2xl shadow-black/80'
        )}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Slider - Always Fully Expanded */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-64 z-50 lg:hidden transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderContent(true)}
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
