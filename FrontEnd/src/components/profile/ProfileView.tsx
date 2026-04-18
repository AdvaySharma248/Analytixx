'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Database,
  MessageSquare,
  BarChart3,
  Upload,
  Search,
  ArrowRight,
  Clock,
  FileSpreadsheet,
  Sparkles,
  LayoutDashboard,
  User,
  Lock,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store/useAppStore';

// ─── Helpers ───
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Profile View ───
export default function ProfileView() {
  const {
    userName,
    userEmail,
    setCurrentView,
    setActiveSection,
    datasets,
    insights,
    queryHistory,
    activeDataset,
    setActiveDataset,
  } = useAppStore();

  const displayName = userName || 'Demo User';
  const displayEmail = userEmail || 'user@company.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ─── Dynamic stats from real store data ───
  const stats = useMemo(() => [
    {
      label: 'Datasets',
      value: datasets.length,
      icon: <Database className="w-4 h-4" />,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Queries',
      value: queryHistory.length,
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
    },
    {
      label: 'Charts',
      value: insights.length,
      icon: <BarChart3 className="w-4 h-4" />,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ], [datasets.length, queryHistory.length, insights.length]);

  // ─── Recent activity from real data ───
  const recentActivity = useMemo(() => {
    const activities: { type: 'upload' | 'query' | 'chart'; label: string; detail: string; time: string; rawTime: string }[] = [];

    // Last uploaded datasets
    datasets.slice(0, 2).forEach((ds) => {
      activities.push({
        type: 'upload',
        label: 'Uploaded dataset',
        detail: ds.filename,
        time: timeAgo(ds.createdAt),
        rawTime: ds.createdAt,
      });
    });

    // Last queries
    queryHistory.slice(0, 2).forEach((q) => {
      activities.push({
        type: 'query',
        label: 'Asked a question',
        detail: q.question.length > 60 ? q.question.slice(0, 57) + '...' : q.question,
        time: timeAgo(q.createdAt),
        rawTime: q.createdAt,
      });
    });

    // Last insights
    insights.slice(0, 2).forEach((ins) => {
      activities.push({
        type: 'chart',
        label: 'Generated chart',
        detail: ins.title,
        time: timeAgo(ins.createdAt),
        rawTime: ins.createdAt,
      });
    });

    // Sort by most recent
    return activities.sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime()).slice(0, 5);
  }, [datasets, queryHistory, insights]);

  const activityIcon = (type: 'upload' | 'query' | 'chart') => {
    switch (type) {
      case 'upload': return <Upload className="w-3.5 h-3.5" />;
      case 'query': return <Search className="w-3.5 h-3.5" />;
      case 'chart': return <BarChart3 className="w-3.5 h-3.5" />;
    }
  };

  const activityColor = (type: 'upload' | 'query' | 'chart') => {
    switch (type) {
      case 'upload': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400';
      case 'query': return 'text-violet-500 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400';
      case 'chart': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400';
    }
  };

  const goToDashboard = () => {
    setCurrentView('dashboard');
    setActiveSection('dashboard');
  };

  const goToUpload = () => {
    setCurrentView('dashboard');
    setActiveSection('upload');
  };

  const goToDatasets = () => {
    if (datasets.length > 0 && !activeDataset) {
      setActiveDataset(datasets[0]);
    }
    setCurrentView('dashboard');
    setActiveSection('dashboard');
  };

  // animation stagger helper
  const stagger = (i: number) => ({ delay: 0.06 * i });

  return (
    <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">
      {/* Back navigation */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        onClick={goToDashboard}
        className="
          flex items-center gap-2 text-[13px] font-medium
          text-[#6B7280] dark:text-gray-400
          hover:text-[#111827] dark:hover:text-gray-100
          transition-colors duration-200 mb-6
        "
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </motion.button>

      {/* ─── 1. Profile Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="
          bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
          overflow-hidden transition-colors duration-300
        "
      >
        {/* Gradient header with name inside */}
        <div className="bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#475569] dark:from-white/[0.06] dark:via-white/[0.04] dark:to-white/[0.02] px-6 pt-6 pb-10">
          <h1 className="text-[18px] font-bold text-white truncate">
            {displayName}
          </h1>
          <p className="text-[13px] text-white/60 truncate mt-0.5">
            Data Analyst
          </p>
        </div>

        {/* Avatar overlapping gradient edge + info row */}
        <div className="px-6 pb-5 -mt-6">
          <div className="flex items-end gap-3">
            <Avatar className="h-14 w-14 ring-[3px] ring-white dark:ring-[#1a1a28] transition-colors duration-300 shrink-0">
              <AvatarFallback className="bg-[#1e293b] dark:bg-white/10 text-white text-base font-semibold rounded-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-x-5 gap-y-1 pb-1">
              <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] dark:text-gray-400">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{displayEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined January 2026</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. Usage Stats ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ...stagger(1) }}
        className="mt-3 grid grid-cols-3 gap-3"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="
              bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
              p-4 transition-colors duration-300
            "
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-[22px] font-bold text-[#111827] dark:text-gray-100 leading-none">
              {stat.value}
            </p>
            <p className="text-[11px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider mt-1.5">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ─── 3. Recent Activity ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ...stagger(2) }}
        className="
          mt-3 bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
          transition-colors duration-300
        "
      >
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#6B7280] dark:text-gray-400" />
            <h2 className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-[0.08em]">
              Recent Activity
            </h2>
          </div>
        </div>

        {recentActivity.length > 0 ? (
          <div className="px-5 pb-4">
            <div className="space-y-0">
              {recentActivity.map((activity, i) => (
                <div
                  key={`${activity.type}-${i}`}
                  className="flex items-start gap-3 py-3 border-b border-[#F3F4F5] dark:border-white/[0.04] last:border-0"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activityColor(activity.type)}`}>
                    {activityIcon(activity.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#374151] dark:text-gray-200 truncate">
                      {activity.label}
                    </p>
                    <p className="text-[12px] text-[#6B7280] dark:text-gray-400 truncate mt-0.5">
                      {activity.detail}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500 shrink-0 mt-0.5">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 pt-2">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-[#9CA3AF] dark:text-gray-500" />
              </div>
              <p className="text-[13px] font-medium text-[#374151] dark:text-gray-300">No activity yet</p>
              <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500 mt-1 max-w-[240px]">
                Upload a dataset and run your first query to start tracking activity here.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── 4. Quick Actions ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ...stagger(3) }}
        className="mt-3 grid grid-cols-2 gap-3"
      >
        <button
          onClick={goToDatasets}
          className="
            group bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
            p-4 text-left transition-all duration-200
            hover:border-[#D1D5DB] dark:hover:border-white/[0.14]
            hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:hover:shadow-none
          "
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#D1D5DB] dark:text-gray-600 group-hover:text-[#6B7280] dark:group-hover:text-gray-400 transition-colors" />
          </div>
          <p className="text-[13px] font-medium text-[#374151] dark:text-gray-200">
            View Datasets
          </p>
          <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 mt-0.5">
            {datasets.length > 0 ? `${datasets.length} dataset${datasets.length > 1 ? 's' : ''} uploaded` : 'No datasets yet'}
          </p>
        </button>

        <button
          onClick={goToUpload}
          className="
            group bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
            p-4 text-left transition-all duration-200
            hover:border-[#D1D5DB] dark:hover:border-white/[0.14]
            hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:hover:shadow-none
          "
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Upload className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#D1D5DB] dark:text-gray-600 group-hover:text-[#6B7280] dark:group-hover:text-gray-400 transition-colors" />
          </div>
          <p className="text-[13px] font-medium text-[#374151] dark:text-gray-200">
            Upload New Data
          </p>
          <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 mt-0.5">
            Import a CSV to analyze
          </p>
        </button>

        <button
          onClick={() => { setCurrentView('dashboard'); setActiveSection('insights'); }}
          className="
            group bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
            p-4 text-left transition-all duration-200
            hover:border-[#D1D5DB] dark:hover:border-white/[0.14]
            hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:hover:shadow-none
          "
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#D1D5DB] dark:text-gray-600 group-hover:text-[#6B7280] dark:group-hover:text-gray-400 transition-colors" />
          </div>
          <p className="text-[13px] font-medium text-[#374151] dark:text-gray-200">
            View Insights
          </p>
          <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 mt-0.5">
            {insights.length > 0 ? `${insights.length} chart${insights.length > 1 ? 's' : ''} generated` : 'No insights yet'}
          </p>
        </button>

        <button
          onClick={goToDashboard}
          className="
            group bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
            p-4 text-left transition-all duration-200
            hover:border-[#D1D5DB] dark:hover:border-white/[0.14]
            hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:hover:shadow-none
          "
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#D1D5DB] dark:text-gray-600 group-hover:text-[#6B7280] dark:group-hover:text-gray-400 transition-colors" />
          </div>
          <p className="text-[13px] font-medium text-[#374151] dark:text-gray-200">
            Go to Dashboard
          </p>
          <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 mt-0.5">
            Main workspace
          </p>
        </button>
      </motion.div>

      {/* ─── 5. Account Settings ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ...stagger(4) }}
        className="
          mt-3 bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
          divide-y divide-[#F3F4F5] dark:divide-white/[0.06] transition-colors duration-300
        "
      >
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-[11px] font-medium text-[#6B7280] dark:text-gray-400 uppercase tracking-[0.08em]">
            Account
          </h2>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center text-[#6B7280] dark:text-gray-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500">Display name</p>
              <p className="text-[13px] text-[#374151] dark:text-gray-200 truncate">{displayName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center text-[#6B7280] dark:text-gray-400 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500">Email</p>
              <p className="text-[13px] text-[#374151] dark:text-gray-200 truncate">{displayEmail}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center text-[#6B7280] dark:text-gray-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500">Password</p>
              <p className="text-[13px] text-[#374151] dark:text-gray-200">••••••••</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
