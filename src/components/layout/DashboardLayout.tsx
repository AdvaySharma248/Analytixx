'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Sidebar />

      <div
        className={cn(
          'transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        )}
      >
        <Topbar />
        <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
