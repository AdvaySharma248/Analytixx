'use client';

import React from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { QueryHistory as QueryHistoryType } from '@/types';
import { EmptyState } from '@/components/empty-states/EmptyState';

export default function HistoryPanel() {
  const { queryHistory, setActiveDataset, datasets } = useAppStore();

  if (queryHistory.length === 0) {
    return <EmptyState type="history" />;
  }

  return (
    <div className="space-y-2">
      {queryHistory.map((item: QueryHistoryType) => {
        const ds = datasets.find((d) => d.id === item.datasetId);
        return (
          <div
            key={item.id}
            className="bg-white border border-[#E5E7EB] rounded-xl p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 cursor-pointer group"
            onClick={() => {
              if (ds) setActiveDataset(ds);
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#9CA3AF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1F2937] truncate">{item.question}</p>
                <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">
                  {item.response}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#9CA3AF]">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  {ds && (
                    <>
                      <span>&middot;</span>
                      <span className="text-[#4F46E5]">{ds.filename}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#D1D5DB] shrink-0 mt-1 group-hover:text-[#9CA3AF] transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
