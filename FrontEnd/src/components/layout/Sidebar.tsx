'use client';

import React from 'react';
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
import type { ActiveSection } from '@/store/useAppStore';
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
            <div className="flex items-center gap-3 w-full max-w-[calc(100%-8px)]">
            <svg className="w-7 h-7 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                  <stop offset="50%" stopColor="#2563eb" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M25 65 Q 50 85 75 65" stroke="url(#wGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M35 72 Q 50 86 65 72" stroke="url(#wGrad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M25 80 L50 20 L75 80" stroke="url(#aGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="50" cy="55" r="14" fill="url(#cGrad)" />
            </svg>
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] font-semibold text-[#1F2937] tracking-tight">Analyti<span className="text-[#38bdf8]">xx</span></span>
            </div>
          </div>
          )}
          {sidebarCollapsed && (
            <div className="flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                    <stop offset="50%" stopColor="#2563eb" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M25 65 Q 50 85 75 65" stroke="url(#wGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M35 72 Q 50 86 65 72" stroke="url(#wGrad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M25 80 L50 20 L75 80" stroke="url(#aGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="50" cy="55" r="14" fill="url(#cGrad)" />
              </svg>
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
