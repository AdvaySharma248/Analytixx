'use client';

import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function DataTable() {
  const { activeDataset } = useAppStore();

  const columns = useMemo(() => activeDataset?.columns || [], [activeDataset]);
  const rows = useMemo(() => activeDataset?.dataPreview || [], [activeDataset]);

  if (!activeDataset || rows.length === 0) return null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#F3F4F6] flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-medium text-[#1F2937]">Data Preview</h3>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Showing {rows.length} of {activeDataset.rowCount.toLocaleString()} rows
          </p>
        </div>
      </div>

      <ScrollArea className="max-h-[400px]">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F9FAFB]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-[11px] font-medium text-[#6B7280] uppercase tracking-wider whitespace-nowrap border-b border-[#E5E7EB]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[#F3F4F6] hover:bg-[#FAFBFC] transition-colors duration-100"
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-[#374151] whitespace-nowrap">
                    {row[col] != null ? String(row[col]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
