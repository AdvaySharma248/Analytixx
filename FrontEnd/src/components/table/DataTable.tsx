'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useAppStore } from '@/store/useAppStore';

export default function DataTable() {
  const { activeDataset } = useAppStore();

  if (!activeDataset) return null;

  const { columns, dataPreview } = activeDataset;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#1a1a28]">
        <div className="border-b border-[#F3F4F5] px-5 py-4 dark:border-white/[0.06]">
          <p className="dashboard-section-kicker">Raw Data</p>
          <h3 className="mt-1 text-[20px] font-bold leading-tight text-[#111827] dark:text-gray-100">
            Preview Table
          </h3>
          <p className="mt-1 text-[13px] leading-6 text-[#4B5563] dark:text-gray-300">
            Review the uploaded rows before asking for deeper analysis.
          </p>
        </div>

        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#E8EAED] bg-[#F7F8FA] hover:bg-[#F7F8FA] dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.04]">
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="h-10 px-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#4B5563] transition-colors duration-300 dark:text-gray-300"
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataPreview.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-b border-[#F5F5F5] even:bg-[#FAFAFB]/50 dark:border-white/[0.06] dark:even:bg-white/[0.02]"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="px-4 py-3 text-[13px] leading-6 text-[#1F2937] transition-colors duration-300 dark:text-gray-200"
                    >
                      {row[col] != null ? String(row[col]) : (
                        <span className="text-[#9CA3AF] dark:text-gray-500">-</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {dataPreview.length < activeDataset.rowCount && (
          <div className="border-t border-[#F0F1F3] bg-[#FAFAFB] px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="text-center text-[12px] leading-5 text-[#6B7280] dark:text-gray-400">
              Showing {dataPreview.length} of {activeDataset.rowCount.toLocaleString()} rows (preview)
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
