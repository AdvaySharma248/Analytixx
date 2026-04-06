'use client';

import React, { Component, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UploadBox from '@/components/upload/UploadBox';
import QueryInput from '@/components/ai/QueryInput';
import InsightCard from '@/components/ai/InsightCard';
import HistoryPanel from '@/components/ai/HistoryPanel';
import DataTable from '@/components/table/DataTable';
import { EmptyState } from '@/components/empty-states/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, FileSpreadsheet, BarChart3, Database, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Error boundary to catch rendering errors
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-md text-center">
            <AlertTriangle className="w-8 h-8 text-[#D97706] mx-auto mb-3" />
            <h2 className="text-[15px] font-semibold text-[#1F2937] mb-2">Something went wrong</h2>
            <p className="text-[13px] text-[#6B7280] mb-4">{this.state.error}</p>
            <Button
              onClick={() => this.setState({ hasError: false, error: '' })}
              variant="outline"
              size="sm"
              className="text-[13px]"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardContent() {
  const {
    activeSection,
    activeDataset,
    insights,
    isQuerying,
    datasets,
    queryHistory,
    setDatasets,
    setQueryHistory,
    setActiveSection,
  } = useAppStore();

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
  }, [setDatasets, setQueryHistory]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {activeSection === 'dashboard' && (
          <>
            {datasets.length === 0 && (
              <WelcomeBanner onUpload={() => setActiveSection('upload')} />
            )}
            {datasets.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard icon={<Database className="w-4 h-4" />} label="Datasets" value={datasets.length.toString()} color="bg-[#EEF2FF] text-[#4F46E5]" />
                <StatCard icon={<FileSpreadsheet className="w-4 h-4" />} label="Total Rows" value={datasets.reduce((a, d) => a + d.rowCount, 0).toLocaleString()} color="bg-[#F0FDF4] text-[#10B981]" />
                <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Insights" value={insights.length.toString()} color="bg-[#FFF7ED] text-[#D97706]" />
                <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Queries" value={queryHistory.length.toString()} color="bg-[#FEF2F2] text-[#DC2626]" />
              </div>
            )}
            {datasets.length > 0 && (
              <>
                <UploadBox />
                {activeDataset && <QueryInput />}
                {activeDataset && <DataTable />}
                <div>
                  {insights.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[14px] font-medium text-[#1F2937]">Recent Insights</h2>
                        <button onClick={() => setActiveSection('insights')} className="text-[12px] text-[#4F46E5] hover:text-[#4338CA]">View all</button>
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
        {activeSection === 'upload' && (
          <>
            <UploadBox />
            {activeDataset && <div className="mt-6"><DataTable /></div>}
          </>
        )}
        {activeSection === 'insights' && (
          <>
            {!activeDataset && <EmptyState type="no-dataset" onAction={() => setActiveSection('upload')} />}
            {activeDataset && (
              <>
                <div className="mb-6"><QueryInput /></div>
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
                {!isQuerying && insights.length === 0 && <EmptyState type="insights" />}
              </>
            )}
          </>
        )}
        {activeSection === 'history' && <HistoryPanel />}
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function WelcomeBanner({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-2">Welcome to DataAI</h2>
          <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-lg">
            Upload a CSV file to start exploring your data with AI-powered analytics.
            Ask natural language questions and get instant insights with interactive charts.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={onUpload} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] h-9 px-4 rounded-lg">
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

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', color)}>{icon}</div>
        <span className="text-[12px] text-[#9CA3AF] font-medium">{label}</span>
      </div>
      <p className="text-xl font-semibold text-[#1F2937] tabular-nums">{value}</p>
    </div>
  );
}
