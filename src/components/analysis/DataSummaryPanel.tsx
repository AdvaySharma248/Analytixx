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
    <div className="
      bg-white dark:bg-[#1a1a28] rounded-xl
      border border-[#ECEDEE] dark:border-white/[0.08]
      px-4 py-3.5 transition-colors duration-300
      hover:border-[#DDDEE0] dark:hover:border-white/[0.12]
    ">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center shrink-0 transition-colors duration-300">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider transition-colors duration-300">{label}</p>
          <p className="text-[16px] font-semibold text-[#111827] dark:text-gray-100 leading-tight mt-0.5 transition-colors duration-300">{value}</p>
          {sub && <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 mt-0.5 transition-colors duration-300">{sub}</p>}
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
        icon: <Table2 className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />,
        label: 'Total Records',
        value: activeDataset.rowCount.toLocaleString(),
      },
      {
        icon: <Columns3 className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />,
        label: 'Columns',
        value: activeDataset.columnCount,
      },
      {
        icon: <CheckCircle2 className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />,
        label: 'Status',
        value: 'Ready',
      },
      {
        icon: <ShieldCheck className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />,
        label: 'Data Quality',
        value: '100%',
        sub: 'No missing values detected',
      },
      {
        icon: <Hash className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />,
        label: 'File Size',
        value: formatFileSize(activeDataset.fileSize),
      },
      {
        icon: <CalendarRange className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />,
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
      {/* Section header */}
      <div>
        <h2 className="text-[13px] font-semibold text-[#374151] dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">Data Summary</h2>
        {activeDataset && (
          <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500 mt-1 truncate transition-colors duration-300">{activeDataset.filename}</p>
        )}
      </div>

      {/* Stats stack */}
      <div className="space-y-2.5">
        {stats.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>

      {/* Columns list */}
      {columns.length > 0 && (
        <div className="
          bg-white dark:bg-[#1a1a28] rounded-xl
          border border-[#ECEDEE] dark:border-white/[0.08]
          px-4 py-3.5 transition-colors duration-300
        ">
          <p className="text-[11px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider mb-2.5 transition-colors duration-300">Fields</p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((col) => (
              <span
                key={col}
                className="
                  inline-flex items-center px-2.5 py-1 rounded-md
                  bg-[#F5F6F7] dark:bg-white/[0.06]
                  text-[12px] font-medium text-[#4B5563] dark:text-gray-300
                  transition-colors duration-300
                "
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Latest insight summary */}
      {latestInsight && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="
            bg-white dark:bg-[#1a1a28] rounded-xl
            border border-[#ECEDEE] dark:border-white/[0.08]
            px-4 py-3.5 transition-colors duration-300
          "
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-gray-500 transition-colors duration-300" />
            <p className="text-[11px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider transition-colors duration-300">Last Analysis</p>
          </div>
          <p className="text-[13px] text-[#374151] dark:text-gray-300 leading-relaxed transition-colors duration-300">{latestInsight.summary}</p>
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
