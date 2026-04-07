'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import InsightCard from './InsightCard';

export default function InsightGrid() {
  const { insights, isQuerying, activeDataset } = useAppStore();

  // Loading state
  if (isQuerying) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#F0F1F3] p-5">
            <Skeleton className="h-4 w-20 rounded-full mb-3" />
            <Skeleton className="h-[15px] w-48 rounded-md mb-2" />
            <Skeleton className="h-[13px] w-full max-w-sm rounded-md mb-4" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F5F5F5]">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (insights.length === 0 && activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-[#9CA3AF]" />
        </div>
        <p className="text-[14px] font-medium text-[#6B7280] mb-1">
          No insights yet
        </p>
        <p className="text-[13px] text-[#9CA3AF] max-w-[260px]">
          Your insights will appear here. Try asking a question about your data.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {insights.map((insight, index) => (
        <InsightCard key={insight.id} insight={insight} index={index} />
      ))}
    </div>
  );
}
