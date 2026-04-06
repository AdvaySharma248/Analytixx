'use client';

import React from 'react';
import { BarChart3, Clock } from 'lucide-react';
import type { Insight } from '@/types';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const chartTypeLabels: Record<string, string> = {
  bar: 'Bar Chart',
  line: 'Line Chart',
  pie: 'Pie Chart',
  area: 'Area Chart',
};

export default function InsightCard({ insight, index }: { insight: Insight; index?: number }) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200'
      )}
      style={{ animationDelay: `${(index || 0) * 80}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#4F46E5] shrink-0" />
          <h3 className="text-[14px] font-semibold text-[#1F2937]">{insight.title}</h3>
        </div>
        <Badge variant="secondary" className="text-[11px] bg-[#F3F4F6] text-[#6B7280] shrink-0">
          {chartTypeLabels[insight.chartType] || insight.chartType}
        </Badge>
      </div>

      {/* Summary */}
      <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4">{insight.summary}</p>

      {/* Chart */}
      <div className="mt-2">
        <ChartRenderer data={insight.chartData} chartType={insight.chartType} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[#F3F4F6]">
        <Clock className="w-3 h-3 text-[#9CA3AF]" />
        <p className="text-[11px] text-[#9CA3AF]">
          Based on your uploaded data &middot; {new Date(insight.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
