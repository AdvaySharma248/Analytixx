'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Table2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import TopNav from '@/components/layout/TopNav';
import UploadSection from '@/components/upload/UploadSection';
import HeroInput from '@/components/ai/HeroInput';
import DataSummaryPanel from '@/components/analysis/DataSummaryPanel';
import MainChartPanel from '@/components/analysis/MainChartPanel';
import DataTable from '@/components/table/DataTable';

export default function DashboardPage() {
  const {
    activeDataset,
    showRawData,
    setShowRawData,
    setDatasets,
    setQueryHistory,
    setActiveDataset,
    setInsights,
  } = useAppStore();

  // Fetch initial data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [datasetsRes, historyRes] = await Promise.all([
          fetch('/api/datasets'),
          fetch('/api/history'),
        ]);

        if (datasetsRes.ok) {
          const ds = await datasetsRes.json();
          setDatasets(ds);
          if (ds.length > 0) {
            setActiveDataset(ds[0]);
          }
        }

        if (historyRes.ok) {
          const history = await historyRes.json();
          setQueryHistory(history);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }
    loadData();
  }, [setDatasets, setQueryHistory, setActiveDataset]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <TopNav />

      <main className="max-w-[1200px] mx-auto px-6 pt-24 pb-16">
        {/* Upload / Hero Input Section */}
        {!activeDataset && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="pt-8"
          >
            {/* Upload card */}
            <UploadSection />

            {/* Placeholder for AI input (disabled until data loaded) */}
            <div className="mt-8">
              <HeroInput />
            </div>
          </motion.div>
        )}

        {/* Dashboard: 2-column focused layout */}
        <AnimatePresence mode="wait">
          {activeDataset && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* AI Input bar — compact, always visible */}
              <div className="mb-8">
                <HeroInput />
              </div>

              {/* 2-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 items-start">
                {/* Left: Data Summary (35%) */}
                <DataSummaryPanel />

                {/* Right: Main Chart (65%) */}
                <MainChartPanel />
              </div>

              {/* Raw Data toggle */}
              <div className="mt-8">
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="
                    inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium
                    text-[#9CA3AF] hover:text-[#6B7280] hover:bg-white transition-all duration-200
                  "
                >
                  <Table2 className="w-3 h-3" />
                  {showRawData ? 'Hide' : 'View'} Raw Data
                </button>
                <AnimatePresence>
                  {showRawData && <DataTable />}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
