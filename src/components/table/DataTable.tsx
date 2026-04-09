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
      <div className="
        bg-white dark:bg-[#1a1a28] rounded-2xl
        border border-[#F0F1F3] dark:border-white/[0.08]
        overflow-hidden transition-colors duration-300
      ">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F8FA] dark:bg-white/[0.04] hover:bg-[#F7F8FA] dark:hover:bg-white/[0.04] border-b border-[#E8EAED] dark:border-white/[0.08]">
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="text-[12px] font-semibold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider h-10 px-4 transition-colors duration-300"
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
                  className="border-b border-[#F5F5F5] dark:border-white/[0.06] even:bg-[#FAFAFB]/50 dark:even:bg-white/[0.02]"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="text-[13px] text-[#374151] dark:text-gray-300 px-4 py-2.5 transition-colors duration-300"
                    >
                      {row[col] != null ? String(row[col]) : (
                        <span className="text-[#D1D5DB] dark:text-gray-600">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {dataPreview.length < activeDataset.rowCount && (
          <div className="px-4 py-2.5 border-t border-[#F0F1F3] dark:border-white/[0.08] bg-[#FAFAFB] dark:bg-white/[0.03]">
            <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500 text-center transition-colors duration-300">
              Showing {dataPreview.length} of {activeDataset.rowCount.toLocaleString()} rows (preview)
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
