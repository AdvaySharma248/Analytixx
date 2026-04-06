'use client';

import React from 'react';
import { BarChart3, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'dashboard' | 'insights' | 'history' | 'no-dataset';
  onAction?: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  if (type === 'dashboard') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-5">
          <BarChart3 className="w-7 h-7 text-[#9CA3AF]" />
        </div>
        <h3 className="text-[15px] font-medium text-[#1F2937] mb-1.5">No insights yet</h3>
        <p className="text-[13px] text-[#9CA3AF] max-w-[280px] leading-relaxed">
          Upload a CSV file and ask questions to generate AI-powered data insights and visualizations.
        </p>
      </div>
    );
  }

  if (type === 'insights') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mb-5">
          <BarChart3 className="w-7 h-7 text-[#4F46E5]" />
        </div>
        <h3 className="text-[15px] font-medium text-[#1F2937] mb-1.5">No insights generated</h3>
        <p className="text-[13px] text-[#9CA3AF] max-w-[280px] leading-relaxed">
          Ask a question about your data to generate your first insight with a chart.
        </p>
      </div>
    );
  }

  if (type === 'history') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-5">
          <BarChart3 className="w-7 h-7 text-[#9CA3AF]" />
        </div>
        <h3 className="text-[15px] font-medium text-[#1F2937] mb-1.5">No query history</h3>
        <p className="text-[13px] text-[#9CA3AF] max-w-[280px] leading-relaxed">
          Your previous questions and their results will appear here.
        </p>
      </div>
    );
  }

  // no-dataset
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-5">
        <FileSpreadsheet className="w-7 h-7 text-[#9CA3AF]" />
      </div>
      <h3 className="text-[15px] font-medium text-[#1F2937] mb-1.5">No dataset selected</h3>
      <p className="text-[13px] text-[#9CA3AF] max-w-[280px] leading-relaxed mb-4">
        Upload a CSV file to start exploring your data with AI.
      </p>
      {onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="text-[13px] border-[#E5E7EB] hover:bg-[#F9FAFB]"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
          Upload CSV
        </Button>
      )}
    </div>
  );
}
