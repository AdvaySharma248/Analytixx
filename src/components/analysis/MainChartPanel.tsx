'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart, Loader2, Table2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartType } from '@/store/useAppStore';

const CHART_TYPES: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: 'bar', label: 'Bar', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { value: 'line', label: 'Line', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: 'pie', label: 'Pie', icon: <PieChart className="w-3.5 h-3.5" /> },
  { value: 'area', label: 'Area', icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

export default function MainChartPanel() {
  const { isQuerying, latestInsight, selectedChartType, setSelectedChartType } = useAppStore();

  const activeChartType = latestInsight?.chartType || selectedChartType;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
      className="w-full space-y-4"
    >
      {/* Chart card */}
      <div className="bg-white rounded-2xl border border-[#ECEDEE] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F5]">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[#111827] truncate">
              {latestInsight ? latestInsight.title : 'Data Overview'}
            </h3>
            {latestInsight && (
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                Based on your query: &ldquo;{latestInsight.query}&rdquo;
              </p>
            )}
          </div>

          {/* Chart type selector */}
          {latestInsight && (
            <div className="flex items-center bg-[#F5F6F7] rounded-lg p-0.5 shrink-0 ml-4">
              {CHART_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedChartType(type.value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium
                    transition-all duration-150
                    ${
                      activeChartType === type.value
                        ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                        : 'text-[#9CA3AF] hover:text-[#6B7280]'
                    }
                  `}
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chart body */}
        <div className="p-5">
          {isQuerying ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-[#9CA3AF] animate-spin" />
                <span className="text-[13px] text-[#9CA3AF]">Analyzing your data...</span>
              </div>
              <Skeleton className="h-[340px] w-full rounded-xl" />
            </div>
          ) : latestInsight ? (
            <motion.div
              key={latestInsight.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <ChartRenderer
                data={latestInsight.chartData}
                chartType={activeChartType}
              />

              {/* AI insight below chart */}
              <div className="mt-5 pt-4 border-t border-[#F3F4F5]">
                <p className="text-[13px] text-[#4B5563] leading-relaxed">
                  {latestInsight.summary}
                </p>
              </div>
            </motion.div>
          ) : (
            <EmptyChartState />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#F5F6F7] flex items-center justify-center mb-4">
        <BarChart3 className="w-6 h-6 text-[#C9CDD1]" />
      </div>
      <p className="text-[14px] font-medium text-[#6B7280] mb-1">
        No visualization yet
      </p>
      <p className="text-[13px] text-[#9CA3AF] max-w-[280px]">
        Ask a question about your data to generate an AI-powered chart and insight.
      </p>
    </div>
  );
}
