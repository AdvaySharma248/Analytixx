'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-[1168px]">
      <nav className="flex items-center justify-between h-11 px-4 rounded-xl bg-white/90 backdrop-blur-xl border border-[#ECEDEE] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-[#111827] flex items-center justify-center">
            <span className="text-[11px] font-bold text-white leading-none">D</span>
          </div>
          <span className="text-[14px] font-semibold text-[#111827] tracking-tight">
            DataAI
          </span>
        </div>

        {/* Center: AI input hint (optional) */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F6F7] text-[12px] text-[#9CA3AF]">
            <SparklesIcon className="w-3 h-3 shrink-0" />
            <span>Ask your data...</span>
          </div>
        </div>

        {/* Right: Settings + Avatar */}
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F5F6F7] transition-colors duration-150">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[#111827] text-white text-[10px] font-semibold rounded-lg">
              DA
            </AvatarFallback>
          </Avatar>
        </div>
      </nav>
    </header>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M9.5 1.5l1.2 3.8L14.5 6.5l-3.8 1.2L9.5 11.5l-1.2-3.8L4.5 6.5l3.8-1.2L9.5 1.5z" />
    </svg>
  );
}
