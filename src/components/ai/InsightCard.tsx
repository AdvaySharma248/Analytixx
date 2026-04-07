'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import ChartRenderer from '@/components/charts/ChartRenderer';
import type { Insight } from '@/types';

interface InsightCardProps {
  insight: Insight;
  index: number;
}

export default function InsightCard({ insight, index }: InsightCardProps) {
  const formattedTime = new Date(insight.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        delay: index * 0.08,
      }}
      className="bg-white rounded-2xl border border-[#F0F1F3] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#E8EAED]"
    >
      {/* Badge */}
      <Badge
        variant="secondary"
        className="bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#F3F4F6] text-[11px] font-medium rounded-full px-2.5 py-0.5 mb-3"
      >
        AI Generated
      </Badge>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-[#111827] mb-1.5 leading-snug">
        {insight.title}
      </h3>

      {/* Summary */}
      <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4 line-clamp-2">
        {insight.summary}
      </p>

      {/* Chart */}
      <div className="rounded-xl bg-[#FAFAFB] p-3 -mx-1">
        <ChartRenderer data={insight.chartData} chartType={insight.chartType} />
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F5F5F5]">
        <span className="text-[11px] text-[#9CA3AF]">{formattedTime}</span>
        <span className="text-[11px] text-[#D1D5DB]">·</span>
        <span className="text-[11px] text-[#9CA3AF] truncate">
          &ldquo;{insight.query}&rdquo;
        </span>
      </div>
    </motion.div>
  );
}
