'use client';

import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Table2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import TopNav from '@/components/layout/TopNav';
import UploadSection from '@/components/upload/UploadSection';
import HeroInput from '@/components/ai/HeroInput';
import InsightGrid from '@/components/ai/InsightGrid';
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

      <main className="max-w-[1200px] mx-auto px-6 pt-24 pb-12">
        <UploadSection />

        {activeDataset && (
          <>
            <div className="mt-16">
              <HeroInput />
            </div>

            <div className="mt-12">
              <InsightGrid />
            </div>

            <div className="mt-8">
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium
                  text-[#6B7280] hover:text-[#111827] hover:bg-white transition-all duration-200
                "
              >
                <Table2 className="w-3.5 h-3.5" />
                {showRawData ? 'Hide' : 'View'} Raw Data
              </button>
              <AnimatePresence>
                {showRawData && <DataTable />}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
