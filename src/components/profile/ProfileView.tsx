'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Calendar, Shield, Database, MessageSquare, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store/useAppStore';

const PROFILE_STATS = [
  { label: 'Datasets Uploaded', value: '3', icon: <Database className="w-4 h-4" /> },
  { label: 'Queries Run', value: '12', icon: <MessageSquare className="w-4 h-4" /> },
  { label: 'Reports Generated', value: '5', icon: <FileText className="w-4 h-4" /> },
];

export default function ProfileView() {
  const { userName, userEmail, setCurrentView } = useAppStore();

  const displayName = userName || 'Demo User';
  const displayEmail = userEmail || 'user@company.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setCurrentView('dashboard')}
        className="
          flex items-center gap-2 text-[13px] font-medium
          text-[#6B7280] dark:text-gray-400
          hover:text-[#111827] dark:hover:text-gray-100
          transition-colors duration-200 mb-8
        "
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </motion.button>

      {/* Profile header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="
          bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
          overflow-hidden transition-colors duration-300
        "
      >
        {/* Top accent bar */}
        <div className="h-24 bg-gradient-to-r from-[#111827] to-[#374151] dark:from-white/[0.08] dark:to-white/[0.04]" />

        {/* Profile info */}
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-[#1a1a28] transition-colors duration-300">
              <AvatarFallback className="bg-[#111827] dark:bg-white/10 text-white text-xl font-semibold rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h1 className="text-[20px] font-semibold text-[#111827] dark:text-gray-100 transition-colors duration-300">
                {displayName}
              </h1>
              <p className="text-[14px] text-[#9CA3AF] dark:text-gray-500 transition-colors duration-300">
                Data Analyst
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        className="
          mt-4 bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
          divide-y divide-[#F3F4F5] dark:divide-white/[0.06] transition-colors duration-300
        "
      >
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-9 h-9 rounded-lg bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center text-[#6B7280] dark:text-gray-400 transition-colors duration-300">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">Email</p>
            <p className="text-[14px] text-[#111827] dark:text-gray-200 transition-colors duration-300">{displayEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-9 h-9 rounded-lg bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center text-[#6B7280] dark:text-gray-400 transition-colors duration-300">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">Plan</p>
            <p className="text-[14px] text-[#111827] dark:text-gray-200 transition-colors duration-300">Pro Plan</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-9 h-9 rounded-lg bg-[#F5F6F7] dark:bg-white/[0.06] flex items-center justify-center text-[#6B7280] dark:text-gray-400 transition-colors duration-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">Member Since</p>
            <p className="text-[14px] text-[#111827] dark:text-gray-200 transition-colors duration-300">January 2025</p>
          </div>
        </div>
      </motion.div>

      {/* Activity stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        className="
          mt-4 bg-white dark:bg-[#1a1a28] rounded-2xl border border-[#ECEDEE] dark:border-white/[0.08]
          p-6 transition-colors duration-300
        "
      >
        <h2 className="text-[13px] font-semibold text-[#374151] dark:text-gray-300 uppercase tracking-wider mb-4 transition-colors duration-300">
          Activity Overview
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {PROFILE_STATS.map((stat) => (
            <div
              key={stat.label}
              className="
                text-center p-4 rounded-xl bg-[#F7F8FA] dark:bg-white/[0.04]
                border border-[#ECEDEE] dark:border-white/[0.06]
                transition-colors duration-300
              "
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/[0.08] flex items-center justify-center mx-auto mb-2 text-[#6B7280] dark:text-gray-400 transition-colors duration-300">
                {stat.icon}
              </div>
              <p className="text-[20px] font-semibold text-[#111827] dark:text-gray-100 transition-colors duration-300">
                {stat.value}
              </p>
              <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 mt-0.5 transition-colors duration-300">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
