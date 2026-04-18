'use client';

import React, { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Table2, Upload, Search, BarChart3, Clock, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import TopNav from '@/components/layout/TopNav';
import LoginView from '@/components/auth/LoginView';
import ProfileView from '@/components/profile/ProfileView';
import UploadSection from '@/components/upload/UploadSection';
import HeroInput from '@/components/ai/HeroInput';
import DataSummaryPanel from '@/components/analysis/DataSummaryPanel';
import MainChartPanel from '@/components/analysis/MainChartPanel';
import DataTable from '@/components/table/DataTable';

// ─── Time formatting ───
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Recent Activity Feed (below upload) ───
function RecentActivityFeed() {
  const { datasets, queryHistory, insights } = useAppStore();

  const activities = useMemo(() => {
    const items: { type: 'upload' | 'query' | 'chart'; label: string; detail: string; time: string; rawTime: string }[] = [];

    datasets.slice(0, 3).forEach((ds) => {
      items.push({ type: 'upload', label: 'Uploaded dataset', detail: ds.filename, time: timeAgo(ds.createdAt), rawTime: ds.createdAt });
    });
    queryHistory.slice(0, 3).forEach((q) => {
      items.push({ type: 'query', label: 'Ran a query', detail: q.question.length > 50 ? q.question.slice(0, 47) + '...' : q.question, time: timeAgo(q.createdAt), rawTime: q.createdAt });
    });
    insights.slice(0, 3).forEach((ins) => {
      items.push({ type: 'chart', label: 'Generated chart', detail: ins.title, time: timeAgo(ins.createdAt), rawTime: ins.createdAt });
    });

    return items.sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime()).slice(0, 5);
  }, [datasets, queryHistory, insights]);

  if (activities.length === 0) return null;

  const iconMap = { upload: Upload, query: Search, chart: BarChart3 };
  const colorMap = {
    upload: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
    query: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
    chart: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="mt-8 bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08] transition-colors duration-300"
    >
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-[#6B7280] dark:text-gray-400" />
        <h2 className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-[0.08em]">
          Recent Activity
        </h2>
      </div>
      <div className="px-5 pb-4">
        {activities.map((activity, i) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={`${activity.type}-${i}`}
              className="flex items-start gap-3 py-3 border-b border-[#F3F4F5] dark:border-white/[0.04] last:border-0"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorMap[activity.type]}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#374151] dark:text-gray-200 truncate">{activity.label}</p>
                <p className="text-[12px] text-[#6B7280] dark:text-gray-400 truncate mt-0.5">{activity.detail}</p>
              </div>
              <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500 shrink-0 mt-0.5">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function DashboardView() {
  const {
    activeDataset,
    showRawData,
    setShowRawData,
    setDatasets,
    setQueryHistory,
    setActiveDataset,
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
    <>
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
            <UploadSection />
            <div className="mt-8">
              <HeroInput />
            </div>
            <RecentActivityFeed />
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
              <div className="mb-8">
                <HeroInput />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 items-start">
                <DataSummaryPanel />
                <MainChartPanel />
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="
                    inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium
                    text-[#4B5563] dark:text-gray-300 hover:text-[#111827] dark:hover:text-gray-100
                    hover:bg-white dark:hover:bg-white/[0.06] transition-all duration-200
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
    </>
  );
}

export default function DashboardPage() {
  const { isLoggedIn, currentView } = useAppStore();

  return (
    <AnimatePresence mode="wait">
      {isLoggedIn ? (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-screen bg-[#F7F8FA] dark:bg-[#0d0d14] transition-colors duration-300"
        >
          {currentView === 'profile' ? <ProfileView /> : <DashboardView />}
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <LoginView />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
