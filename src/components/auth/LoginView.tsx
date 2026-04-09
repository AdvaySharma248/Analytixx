'use client';

import React, { useState, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, BarChart3, Sparkles, Zap, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/useAppStore';

// ─── Feature highlight items ───
const FEATURES = [
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Smart Data Visualization', desc: 'Automatic chart generation from your data' },
  { icon: <Sparkles className="w-5 h-5" />, title: 'AI-Powered Insights', desc: 'Natural language queries, instant answers' },
  { icon: <Zap className="w-5 h-5" />, title: 'Real-time Analysis', desc: 'Process and analyze data in seconds' },
];

// ─── Shared input component ───
function FormInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#6B7280] dark:text-gray-400 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="
          w-full px-3.5 py-2.5 rounded-lg
          border border-[#E5E7EB] dark:border-white/[0.1]
          bg-white dark:bg-[#1e1e2e]
          text-[14px] text-[#111827] dark:text-gray-100
          placeholder-[#C9CDD1] dark:placeholder-gray-600
          outline-none
          focus:border-[#9CA3AF] dark:focus:border-white/[0.2] focus:ring-2 focus:ring-[#9CA3AF]/10 dark:focus:ring-white/[0.05]
        "
      />
    </div>
  );
}

// ─── Sign In form (front) ───
function SignInForm({ onFlip, onSubmit, isLoading }: {
  onFlip: () => void;
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit && !isLoading) onSubmit(email, password);
  };

  return (
    <form onSubmit={handleForm} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-[20px] font-semibold text-[#111827] dark:text-gray-100">Welcome back</h2>
        <p className="text-[14px] text-[#9CA3AF] dark:text-gray-500 mt-1">Sign in to continue to DataAI</p>
      </div>

      <FormInput
        label="Email"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <FormInput
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

      <button
        type="submit"
        disabled={!canSubmit || isLoading}
        className="
          w-full flex items-center justify-center gap-2 h-10 rounded-lg
          bg-[#111827] dark:bg-white/[0.12] hover:bg-[#374151] dark:hover:bg-white/[0.18]
          text-white dark:text-gray-100 text-[14px] font-medium
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>Sign in <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <p className="text-center text-[13px] text-[#9CA3AF] dark:text-gray-500 pt-1">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onFlip}
          className="text-[#111827] dark:text-gray-200 font-medium hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}

// ─── Sign Up form (back) ───
function SignUpForm({ onFlip, onSubmit, isLoading }: {
  onFlip: () => void;
  onSubmit: (name: string, email: string, password: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.trim().length > 0;

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit && !isLoading) onSubmit(name, email, password);
  };

  return (
    <form onSubmit={handleForm} className="space-y-4">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold text-[#111827] dark:text-gray-100">Create account</h2>
        <p className="text-[14px] text-[#9CA3AF] dark:text-gray-500 mt-1">Get started with DataAI for free</p>
      </div>

      <FormInput
        label="Full name"
        placeholder="John Doe"
        value={name}
        onChange={setName}
        autoComplete="name"
      />
      <FormInput
        label="Email"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <FormInput
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />

      <button
        type="submit"
        disabled={!canSubmit || isLoading}
        className="
          w-full flex items-center justify-center gap-2 h-10 rounded-lg
          bg-[#111827] dark:bg-white/[0.12] hover:bg-[#374151] dark:hover:bg-white/[0.18]
          text-white dark:text-gray-100 text-[14px] font-medium
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>Create account <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <p className="text-center text-[13px] text-[#9CA3AF] dark:text-gray-500 pt-1">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onFlip}
          className="text-[#111827] dark:text-gray-200 font-medium hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

// ─── Main Auth View ───
export default function AuthView() {
  const { setIsLoggedIn, setUserName, setUserEmail } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const isDark = theme === 'dark';

  const handleSignIn = async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoggedIn(true);
    setUserEmail(email);
    setUserName(email.split('@')[0] || 'Demo User');
  };

  const handleSignUp = async (name: string, email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoggedIn(true);
    setUserName(name);
    setUserEmail(email);
  };

  // Smooth theme toggle
  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('transitioning');
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setTimeout(() => root.classList.remove('transitioning'), 350);
  }, [theme, setTheme]);

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #070710 0%, #0d0d1a 25%, #121225 42%, #181830 55%, #1e1e3a 68%, #252540 80%, #2a2a45 92%, #2d2d4a 100%)'
          : 'linear-gradient(135deg, #111827 0%, #1e2a3a 28%, #374357 45%, #6b7a8d 58%, #a3b0bd 72%, #d1d7de 85%, #eef0f2 95%, #f5f6f8 100%)',
      }}
    >
      {/* ─── Ambient smoke blobs (CSS handles dark mode automatically) ─── */}
      <div className="smoke-container">
        <div className="smoke-blob smoke-blob--1" />
        <div className="smoke-blob smoke-blob--2" />
        <div className="smoke-blob smoke-blob--3" />
        <div className="smoke-blob smoke-blob--4" />
        <div className="smoke-blob smoke-blob--5" />
      </div>

      {/* ─── Diagonal rain layers (CSS handles dark mode automatically) ─── */}
      <div className="rain-container">
        <div className="rain-layer rain-layer--1" />
        <div className="rain-layer rain-layer--2" />
        <div className="rain-layer rain-layer--3" />
      </div>

      {/* ─── Theme toggle (top-right, always visible) ─── */}
      <div className="absolute top-4 right-4 md:top-5 md:right-6 z-20">
        {mounted && (
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.92 }}
            className="
              h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-md
              border border-white/[0.12] dark:border-white/[0.08]
              bg-white/[0.08] dark:bg-white/[0.06]
              text-white/60 dark:text-white/40
              hover:bg-white/[0.15] dark:hover:bg-white/[0.1]
              hover:text-white/80 dark:hover:text-white/60
            "
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-[16px] h-[16px]" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-[16px] h-[16px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Subtle ambient glow behind auth card area */}
      <div
        className="hidden md:block absolute pointer-events-none z-[2]"
        style={{
          right: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '500px',
          height: '600px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ─── Left: Product Info (sits on gradient, no separate bg) ─── */}
      <div className="hidden md:flex md:w-1/2 lg:w-[52%] flex-col justify-between p-12 lg:p-16 text-white relative z-10">
        {/* Top: Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <span className="text-[14px] font-bold text-white leading-none">D</span>
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white/90">
            DataAI
          </span>
        </div>

        {/* Center: Content */}
        <div className="max-w-md">
          <h1 className="text-[32px] lg:text-[38px] font-semibold leading-tight tracking-tight">
            Turn your data into insights, instantly
          </h1>
          <p className="text-[15px] text-white/50 mt-4 leading-relaxed">
            Upload your dataset and ask questions in plain English. Get visualizations, trends, and summaries powered by AI.
          </p>

          {/* Feature highlights */}
          <div className="mt-10 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center shrink-0 mt-0.5 text-white/60">
                  {f.icon}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white/80">{f.title}</p>
                  <p className="text-[13px] text-white/35 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-[12px] text-white/20">
          &copy; 2025 DataAI. All rights reserved.
        </p>
      </div>

      {/* ─── Right: Auth Card ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:py-0 relative z-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#111827] dark:bg-white/10 flex items-center justify-center">
              <span className="text-[14px] font-bold text-white leading-none">D</span>
            </div>
            <span className="text-[17px] font-semibold text-[#111827] dark:text-gray-100 tracking-tight">
              DataAI
            </span>
          </div>

          {/* Mobile feature list */}
          <div className="md:hidden mb-8 text-center">
            <h2 className="text-[22px] font-semibold text-[#111827] dark:text-gray-100">
              Turn your data into insights
            </h2>
            <p className="text-[14px] text-[#9CA3AF] dark:text-gray-500 mt-2">
              AI-powered data analysis in seconds
            </p>
          </div>

          {/* ─── 3D Flip Card (CSS Grid stacking) ─── */}
          <div style={{ perspective: '1200px' }}>
            <motion.div
              animate={{ rotateY: isSignUp ? 180 : 0 }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                transformStyle: 'preserve-3d',
                display: 'grid',
                gridTemplate: '1fr / 1fr',
              }}
            >
              {/* Front: Sign In */}
              <div
                className={`
                  rounded-2xl p-6
                  ${isDark
                    ? 'bg-[#1a1a2e] border border-white/[0.08] shadow-[0_4px_6px_rgba(0,0,0,0.2),0_10px_30px_rgba(0,0,0,0.3)]'
                    : 'bg-white shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.06)]'
                  }
                `}
                style={{
                  gridArea: '1 / 1',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <SignInForm
                  onFlip={() => setIsSignUp(true)}
                  onSubmit={handleSignIn}
                  isLoading={isLoading}
                />
              </div>

              {/* Back: Sign Up */}
              <div
                className={`
                  rounded-2xl p-6
                  ${isDark
                    ? 'bg-[#1a1a2e] border border-white/[0.08] shadow-[0_4px_6px_rgba(0,0,0,0.2),0_10px_30px_rgba(0,0,0,0.3)]'
                    : 'bg-white shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.06)]'
                  }
                `}
                style={{
                  gridArea: '1 / 1',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <SignUpForm
                  onFlip={() => setIsSignUp(false)}
                  onSubmit={handleSignUp}
                  isLoading={isLoading}
                />
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <p className={`text-center text-[12px] mt-8 ${isDark ? 'text-gray-500' : 'text-[#6B7280]'}`}>
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
