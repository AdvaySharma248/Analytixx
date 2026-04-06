'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UploadBox from '@/components/upload/UploadBox';
import QueryInput from '@/components/ai/QueryInput';
import InsightCard from '@/components/ai/InsightCard';
import HistoryPanel from '@/components/ai/HistoryPanel';
import DataTable from '@/components/table/DataTable';
import { EmptyState } from '@/components/empty-states/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, FileSpreadsheet, BarChart3, Database, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const {
    activeSection,
    activeDataset,
    insights,
    isUploading,
    isQuerying,
    datasets,
    queryHistory,
    setDatasets,
    setInsights,
    setQueryHistory,
    setActiveSection,
  } = useAppStore();

  // Load data on mount
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
            useAppStore.getState().setActiveDataset(ds[0]);
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
  }, [setDatasets, setInsights, setQueryHistory]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* =========== DASHBOARD =========== */}
        {activeSection === 'dashboard' && (
          <>
            {/* Welcome banner (no datasets) */}
            {datasets.length === 0 && (
              <WelcomeBanner onUpload={() => setActiveSection('upload')} />
            )}

            {/* Stats cards */}
            {datasets.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  icon={<Database className="w-4 h-4" />}
                  label="Datasets"
                  value={datasets.length.toString()}
                  color="bg-[#EEF2FF] text-[#4F46E5]"
                />
                <StatCard
                  icon={<FileSpreadsheet className="w-4 h-4" />}
                  label="Total Rows"
                  value={datasets.reduce((acc, d) => acc + d.rowCount, 0).toLocaleString()}
                  color="bg-[#F0FDF4] text-[#10B981]"
                />
                <StatCard
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="Insights"
                  value={insights.length.toString()}
                  color="bg-[#FFF7ED] text-[#D97706]"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Queries"
                  value={queryHistory.length.toString()}
                  color="bg-[#FEF2F2] text-[#DC2626]"
                />
              </div>
            )}

            {/* Upload + Query + Table + Insights */}
            {datasets.length > 0 && (
              <>
                <UploadBox />

                {activeDataset && (
                  <div>
                    <QueryInput />
                  </div>
                )}

                {activeDataset && (
                  <div>
                    <DataTable />
                  </div>
                )}

                {/* Insights preview */}
                <div>
                  {insights.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[14px] font-medium text-[#1F2937]">Recent Insights</h2>
                        <button
                          onClick={() => setActiveSection('insights')}
                          className="text-[12px] text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                        >
                          View all
                        </button>
                      </div>
                      <div className="space-y-4">
                        {insights.slice(0, 3).map((insight, i) => (
                          <InsightCard key={insight.id} insight={insight} index={i} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState type="insights" />
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* =========== UPLOAD =========== */}
        {activeSection === 'upload' && (
          <>
            <UploadBox />
            {activeDataset && (
              <div className="mt-6">
                <DataTable />
              </div>
            )}
          </>
        )}

        {/* =========== INSIGHTS =========== */}
        {activeSection === 'insights' && (
          <>
            {!activeDataset && <EmptyState type="no-dataset" onAction={() => setActiveSection('upload')} />}
            {activeDataset && (
              <>
                <div className="mb-6">
                  <QueryInput />
                </div>
                {isQuerying && (
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-48 rounded" />
                    </div>
                    <Skeleton className="h-3 w-full max-w-md rounded mb-3" />
                    <Skeleton className="h-[280px] w-full rounded-lg" />
                  </div>
                )}
                {!isQuerying && insights.length > 0 && (
                  <div className="space-y-4">
                    {insights.map((insight, i) => (
                      <InsightCard key={insight.id} insight={insight} index={i} />
                    ))}
                  </div>
                )}
                {!isQuerying && insights.length === 0 && (
                  <EmptyState type="insights" />
                )}
              </>
            )}
          </>
        )}

        {/* =========== HISTORY =========== */}
        {activeSection === 'history' && (
          <HistoryPanel />
        )}
      </div>
    </DashboardLayout>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function WelcomeBanner({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-2">
            Welcome to DataAI
          </h2>
          <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-lg">
            Upload a CSV file to start exploring your data with AI-powered analytics.
            Ask natural language questions and get instant insights with interactive charts.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={onUpload}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] h-9 px-4 rounded-lg"
            >
              Upload your first CSV
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
        <div className="hidden md:flex w-48 h-36 rounded-xl bg-gradient-to-br from-[#EEF2FF] to-[#F0FDF4] items-center justify-center shrink-0">
          <BarChart3 className="w-12 h-12 text-[#4F46E5]/30" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-[12px] text-[#9CA3AF] font-medium">{label}</span>
      </div>
      <p className="text-xl font-semibold text-[#1F2937] tabular-nums">{value}</p>
    </div>
  );
}
