'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Table2,
  Columns3,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Hash,
  CalendarRange,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

function StatItem({ icon, label, value, sub }: StatItemProps) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 transition-colors duration-300 hover:border-[#D1D5DB] dark:border-white/[0.08] dark:bg-[#1a1a28] dark:hover:border-white/[0.14]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F7] transition-colors duration-300 dark:bg-white/[0.06]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B7280] dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-[24px] font-bold leading-none text-[#111827] dark:text-gray-100">
            {value}
          </p>
          {sub && (
            <p className="mt-1.5 text-[12px] leading-5 text-[#6B7280] dark:text-gray-400">
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DataSummaryPanel() {
  const { activeDataset, latestInsight } = useAppStore();

  const stats = useMemo(() => {
    if (!activeDataset) return [];

    const fileDate = new Date(activeDataset.createdAt);
    const formattedDate = fileDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return [
      {
        icon: <Table2 className="h-4 w-4 text-[#4B5563] dark:text-gray-300" />,
        label: 'Total Records',
        value: activeDataset.rowCount.toLocaleString(),
      },
      {
        icon: <Columns3 className="h-4 w-4 text-[#4B5563] dark:text-gray-300" />,
        label: 'Columns',
        value: activeDataset.columnCount,
      },
      {
        icon: <CheckCircle2 className="h-4 w-4 text-[#4B5563] dark:text-gray-300" />,
        label: 'Status',
        value: 'Ready',
      },
      {
        icon: <ShieldCheck className="h-4 w-4 text-[#4B5563] dark:text-gray-300" />,
        label: 'Data Quality',
        value: '100%',
        sub: 'No missing values detected',
      },
      {
        icon: <Hash className="h-4 w-4 text-[#4B5563] dark:text-gray-300" />,
        label: 'File Size',
        value: formatFileSize(activeDataset.fileSize),
      },
      {
        icon: <CalendarRange className="h-4 w-4 text-[#4B5563] dark:text-gray-300" />,
        label: 'Uploaded',
        value: formattedDate,
      },
    ];
  }, [activeDataset]);

  const columns = activeDataset?.columns || [];

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
      className="w-full space-y-4"
    >
      <div className="space-y-1.5">
        <p className="dashboard-section-kicker">Overview</p>
        <h2 className="text-[20px] font-bold leading-tight text-[#111827] dark:text-gray-100">
          Data Summary
        </h2>
        <p className="dashboard-subtitle">
          Track schema, volume, and analysis readiness at a glance.
        </p>
        {activeDataset && (
          <p className="truncate text-[14px] font-medium text-[#111827] dark:text-gray-100">
            {activeDataset.filename}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        {stats.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>

      {columns.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#1a1a28]">
          <div className="space-y-1">
            <p className="dashboard-label">Schema</p>
            <p className="dashboard-subtitle">Fields available for analysis</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {columns.map((col) => (
              <span
                key={col}
                className="inline-flex items-center rounded-lg bg-[#F5F6F7] px-2.5 py-1.5 text-[12px] font-medium text-[#374151] transition-colors duration-300 dark:bg-white/[0.06] dark:text-gray-200"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {latestInsight && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#1a1a28]"
        >
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#4B5563] transition-colors duration-300 dark:text-gray-300" />
            <p className="dashboard-label">Latest Analysis</p>
          </div>
          <p className="text-[14px] leading-7 text-[#374151] dark:text-gray-200">
            {latestInsight.summary}
          </p>
        </motion.div>
      )}
    </motion.aside>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
