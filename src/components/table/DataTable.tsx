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
      <div className="bg-white rounded-2xl border border-[#F0F1F3] overflow-hidden">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F7F8FA] hover:bg-[#F7F8FA] border-b border-[#E8EAED]">
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider h-10 px-4"
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
                  className="border-b border-[#F5F5F5] even:bg-[#FAFAFB]/50"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className="text-[13px] text-[#374151] px-4 py-2.5"
                    >
                      {row[col] != null ? String(row[col]) : (
                        <span className="text-[#D1D5DB]">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {dataPreview.length < activeDataset.rowCount && (
          <div className="px-4 py-2.5 border-t border-[#F0F1F3] bg-[#FAFAFB]">
            <p className="text-[12px] text-[#9CA3AF] text-center">
              Showing {dataPreview.length} of {activeDataset.rowCount.toLocaleString()} rows (preview)
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
