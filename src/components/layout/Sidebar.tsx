'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Upload,
  Lightbulb,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { ActiveSection } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const navItems: { id: ActiveSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Data', icon: Upload },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'history', label: 'History', icon: History },
];

export default function Sidebar() {
  const {
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarMobileOpen,
    setSidebarMobileOpen,
    datasets,
    activeDataset,
    setActiveDataset,
  } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-[1px]"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-60',
          // Mobile: slide in/out
          'lg:translate-x-0',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-[#E5E7EB] shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-[#1F2937] tracking-tight">DataAI</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center mx-auto">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          {/* Mobile close */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7"
            onClick={() => setSidebarMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3 px-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-[#F3F4F6] text-[#1F2937] font-medium'
                      : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1F2937]'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Datasets list */}
          {!sidebarCollapsed && datasets.length > 0 && (
            <div className="mt-6">
              <Separator className="mb-3" />
              <p className="px-2.5 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
                Datasets
              </p>
              <div className="space-y-0.5">
                {datasets.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => setActiveDataset(ds)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors duration-150 truncate',
                      activeDataset?.id === ds.id
                        ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1F2937]'
                    )}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{ds.filename}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Collapse toggle - desktop only */}
        <div className="hidden lg:flex items-center justify-center h-10 border-t border-[#E5E7EB] shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#9CA3AF] hover:text-[#6B7280]"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
