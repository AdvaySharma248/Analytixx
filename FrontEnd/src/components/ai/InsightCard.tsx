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
      className="
        bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#F0F1F3] dark:border-white/[0.08]
        p-5 transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]
        hover:border-[#E8EAED] dark:hover:border-white/[0.12]
      "
    >
      {/* Badge */}
      <Badge
        variant="secondary"
        className="
          bg-[#F3F4F6] dark:bg-white/[0.06]
          text-[#9CA3AF] dark:text-gray-500
          hover:bg-[#F3F4F6] dark:hover:bg-white/[0.06]
          text-[11px] font-medium rounded-full px-2.5 py-0.5 mb-3
          transition-colors duration-300
        "
      >
        AI Generated
      </Badge>

      {/* Title */}
      <h3 className="text-[15px] font-bold text-[#111827] dark:text-gray-100 mb-1.5 leading-snug transition-colors duration-300">
        {insight.title}
      </h3>

      {/* Summary */}
      <p className="text-[13px] text-[#6B7280] dark:text-gray-400 leading-relaxed mb-4 line-clamp-2 transition-colors duration-300">
        {insight.summary}
      </p>

      {/* Chart */}
      <div className="rounded-xl bg-[#FAFAFB] dark:bg-white/[0.03] p-3 -mx-1 transition-colors duration-300">
        <ChartRenderer data={insight.chartData} chartType={insight.chartType} />
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F5F5F5] dark:border-white/[0.06]">
        <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500 transition-colors duration-300">{formattedTime}</span>
        <span className="text-[11px] text-[#D1D5DB] dark:text-gray-600 transition-colors duration-300">·</span>
        <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500 truncate transition-colors duration-300">
          &ldquo;{insight.query}&rdquo;
        </span>
      </div>
    </motion.div>
  );
}
