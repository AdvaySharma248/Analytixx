'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Bot, Loader2, PieChart, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  createInsightFromResponse,
  createQueryHistoryFromResponse,
  runDatasetQuery,
} from '@/lib/query';
import { buildDetailedInsight } from '@/lib/insight-analysis';
import { useAppStore } from '@/store/useAppStore';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartType } from '@/store/useAppStore';
import type { Dataset, Insight } from '@/types';

const CHART_TYPES: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: 'bar', label: 'Bar', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { value: 'line', label: 'Line', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'pie', label: 'Pie', icon: <PieChart className="h-3.5 w-3.5" /> },
  { value: 'area', label: 'Area', icon: <TrendingUp className="h-3.5 w-3.5" /> },
];

function buildFollowUpSuggestions(insight: Insight, dataset: Dataset | null) {
  const suggestions = new Set<string>();
  const query = insight.query.toLowerCase();
  const topPerformer = insight.chartData[0]?.name;
  const runnerUp = insight.chartData[1]?.name;
  const columns = dataset?.columns ?? [];
  const preferredBreakdowns = ['Region', 'Category', 'Product', 'Customer'];
  const breakdownColumn = preferredBreakdowns.find(
    (column) => columns.includes(column) && !query.includes(column.toLowerCase()),
  );

  if (insight.chartType === 'line' || insight.chartType === 'area' || query.includes('month')) {
    suggestions.add('Compare this month with the previous month');

    if (breakdownColumn) {
      suggestions.add(`Show this monthly comparison by ${breakdownColumn.toLowerCase()}`);
    }

    if (columns.includes('Product')) {
      suggestions.add('Which product changed the most month over month?');
    }
  } else {
    if (breakdownColumn) {
      suggestions.add(`Break this down by ${breakdownColumn.toLowerCase()}`);
    }

    if (topPerformer) {
      suggestions.add(`Why is ${topPerformer} performing best?`);
    }

    if (topPerformer && runnerUp) {
      suggestions.add(`Compare ${topPerformer} against ${runnerUp}`);
    }
  }

  if (columns.includes('Region') && !query.includes('region')) {
    suggestions.add('Show the same analysis by region');
  }

  if (columns.includes('Category') && !query.includes('category')) {
    suggestions.add('Show the same analysis by category');
  }

  return [...suggestions].filter((suggestion) => suggestion.toLowerCase() !== query).slice(0, 4);
}

export default function MainChartPanel() {
  const {
    activeDataset,
    addInsight,
    addQuery,
    isQuerying,
    latestInsight,
    selectedChartType,
    setActiveSection,
    setIsQuerying,
    setSelectedChartType,
  } = useAppStore();

  const activeChartType = latestInsight ? selectedChartType : 'bar';
  const chartTitle = latestInsight ? latestInsight.title : 'Data Overview';
  const chartSubtitle = latestInsight
    ? `Based on your query: "${latestInsight.query}"`
    : 'Run an analysis to turn your dataset into a visual story.';
  const followUpSuggestions = latestInsight
    ? buildFollowUpSuggestions(latestInsight, activeDataset)
    : [];
  const detailedInsight = latestInsight
    ? buildDetailedInsight(latestInsight, activeDataset)
    : null;

  const handleSuggestionClick = async (question: string) => {
    if (!activeDataset || isQuerying) {
      return;
    }

    setIsQuerying(true);

    try {
      const data = await runDatasetQuery(activeDataset.id, question);
      addInsight(createInsightFromResponse(data, question));
      addQuery(createQueryHistoryFromResponse(data, question));
      setActiveSection('insights');
    } catch (error) {
      console.error('Query error:', error);
      toast.error(error instanceof Error ? error.message : 'Query failed');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
      className="w-full space-y-4"
    >
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#1a1a28]">
        <div className="flex items-start justify-between gap-4 border-b border-[#F3F4F5] px-5 py-4 dark:border-white/[0.06]">
          <div className="min-w-0 space-y-1.5">
            <p className="dashboard-section-kicker">Visualization</p>
            <h3 className="truncate text-[20px] font-bold leading-tight text-[#111827] dark:text-gray-100">
              {chartTitle}
            </h3>
            <p className="dashboard-subtitle">{chartSubtitle}</p>
          </div>

          {latestInsight && (
            <div className="ml-4 flex shrink-0 items-center rounded-xl bg-[#F5F6F7] p-0.5 transition-colors duration-300 dark:bg-white/[0.06]">
              {CHART_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedChartType(type.value)}
                  className={`
                    flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150
                    ${
                      activeChartType === type.value
                        ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-white/[0.12] dark:text-gray-100 dark:shadow-none'
                        : 'text-[#4B5563] hover:text-[#111827] dark:text-gray-400 dark:hover:text-gray-200'
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

        <div className="p-5">
          {isQuerying ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#4B5563] transition-colors duration-300 dark:text-gray-300" />
                <span className="text-[14px] text-[#4B5563] dark:text-gray-300">
                  Analyzing your data...
                </span>
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

              {detailedInsight && (
                <div className="mt-5 border-t border-[#F3F4F5] pt-5 dark:border-white/[0.06]">
                  <div className="space-y-1.5">
                    <p className="dashboard-label">Detailed analysis</p>
                    <p className="text-[13px] leading-6 text-[#6B7280] dark:text-gray-400">
                      A fuller analyst-style explanation of the latest result.
                    </p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#111827] px-4 py-3 text-[13px] font-medium leading-6 text-white dark:bg-white/[0.1] dark:text-gray-100">
                        {latestInsight.query}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#374151] dark:bg-white/[0.08] dark:text-gray-200">
                        <Bot className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1 rounded-[22px] rounded-tl-md border border-[#E5E7EB] bg-[#F9FAFB] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-[#6B7280] dark:text-gray-400" />
                          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] dark:text-gray-400">
                            Analytixx Analyst
                          </p>
                        </div>

                        <p className="mt-3 text-[15px] font-semibold leading-7 text-[#111827] dark:text-gray-100">
                          {detailedInsight.intro}
                        </p>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {detailedInsight.metrics.map((metric) => (
                            <div
                              key={metric.label}
                              className="rounded-2xl border border-[#ECEDEE] bg-white px-3 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] dark:text-gray-400">
                                {metric.label}
                              </p>
                              <p className="mt-1 text-[14px] font-semibold leading-6 text-[#111827] dark:text-gray-100">
                                {metric.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 space-y-3">
                          {detailedInsight.paragraphs.map((paragraph) => (
                            <p
                              key={paragraph}
                              className="text-[14px] leading-7 text-[#374151] dark:text-gray-200"
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>

                        <div className="mt-4 rounded-2xl bg-[#F3F4F6] px-4 py-3 text-[13px] leading-6 text-[#4B5563] dark:bg-white/[0.05] dark:text-gray-300">
                          {detailedInsight.closing}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {followUpSuggestions.length > 0 && (
                <div className="mt-5 border-t border-[#F3F4F5] pt-4 dark:border-white/[0.06]">
                  <div className="space-y-1.5">
                    <p className="dashboard-label">Suggested next questions</p>
                    <p className="text-[13px] leading-6 text-[#6B7280] dark:text-gray-400">
                      Continue the analysis from this result with one click.
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {followUpSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={isQuerying}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-left text-[12px] font-medium text-[#374151] transition-colors duration-150 hover:border-[#D1D5DB] hover:bg-[#F3F4F6] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.08] dark:hover:text-gray-100"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F6F7] transition-colors duration-300 dark:bg-white/[0.06]">
        <BarChart3 className="h-6 w-6 text-[#6B7280] transition-colors duration-300 dark:text-gray-500" />
      </div>
      <p className="text-[18px] font-bold text-[#111827] dark:text-gray-100">
        No visualization yet
      </p>
      <p className="mt-2 max-w-[320px] text-[14px] leading-7 text-[#4B5563] dark:text-gray-300">
        Ask a question about your data to generate an AI-powered chart and insight.
      </p>
    </div>
  );
}
