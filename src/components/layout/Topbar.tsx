'use client';

import React from 'react';
import { Menu, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const sectionTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  upload: 'Upload Data',
  insights: 'Insights',
  history: 'History',
};

export default function Topbar() {
  const { activeSection, sidebarCollapsed, setSidebarMobileOpen, activeDataset } = useAppStore();

  const title = activeDataset
    ? `${activeDataset.filename.replace('.csv', '')}`
    : sectionTitles[activeSection] || 'Dashboard';

  return (
    <header
      className={cn(
        'h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 md:px-6 shrink-0 transition-all duration-200',
        sidebarCollapsed ? '' : ''
      )}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={() => setSidebarMobileOpen(true)}
        >
          <Menu className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-[15px] font-medium text-[#1F2937]">{title}</h1>
          {activeDataset && (
            <p className="text-[11px] text-[#9CA3AF] -mt-0.5">
              {activeDataset.rowCount.toLocaleString()} rows &middot; {activeDataset.columnCount} columns
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9CA3AF] hover:text-[#6B7280]">
          <Bell className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9CA3AF] hover:text-[#6B7280]">
          <Settings className="w-4 h-4" />
        </Button>
        <div className="ml-1.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[11px] font-medium bg-[#F3F4F6] text-[#6B7280]">
              DA
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
