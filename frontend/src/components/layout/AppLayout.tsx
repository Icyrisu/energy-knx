import React, { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('energy-sidebar-collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('energy-sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMobileMenuToggle={toggleMobile} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
