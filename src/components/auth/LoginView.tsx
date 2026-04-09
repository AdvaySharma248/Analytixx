'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function LoginView() {
  const { setIsLoggedIn } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
    setIsLoading(true);

    // Simulate auth delay
    await new Promise((r) => setTimeout(r, 800));
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[380px]"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center">
            <span className="text-[14px] font-bold text-white leading-none">D</span>
          </div>
          <span className="text-[18px] font-semibold text-[#111827] tracking-tight">
            DataAI
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-[20px] font-semibold text-[#111827]">
            Welcome back
          </h1>
          <p className="text-[14px] text-[#9CA3AF] mt-1.5">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#ECEDEE] p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#6B7280] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#ECEDEE] bg-[#FAFAFB] text-[14px] text-[#111827] placeholder-[#C9CDD1] outline-none transition-colors focus:border-[#9CA3AF] focus:bg-white"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#6B7280] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#ECEDEE] bg-[#FAFAFB] text-[14px] text-[#111827] placeholder-[#C9CDD1] outline-none transition-colors focus:border-[#9CA3AF] focus:bg-white"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-[#111827] hover:bg-[#374151] text-white text-[14px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Sign in <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[12px] text-[#C9CDD1] mt-6">
          By signing in, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
