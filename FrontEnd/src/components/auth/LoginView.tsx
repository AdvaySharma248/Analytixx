'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Bot, Loader2, BarChart3, Sparkles, TrendingUp, Zap, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth-client';
import { useAppStore } from '@/store/useAppStore';
import RainEffect from './RainEffect';

// ─── Feature highlight items ───
const FEATURES = [
  { icon: BarChart3, title: 'Smart Visualization', desc: 'Charts appear instantly from uploaded rows.' },
  { icon: Sparkles, title: 'AI Insights', desc: 'Ask plain-English questions and get answers fast.' },
  { icon: Zap, title: 'Real-time Analysis', desc: 'Spot trends, spikes, and winners in seconds.' },
];

const PREVIEW_STATS = [
  { label: 'Revenue', value: '$128.4K', change: '+18.2%' },
  { label: 'Top Product', value: 'Apex Pro', change: 'No. 1 SKU' },
  { label: 'Growth', value: '24.6%', change: 'QoQ momentum' },
] as const;

const PREVIEW_BARS = [38, 56, 49, 72, 68, 88, 95] as const;
const QUERY_SPARKLINE = [28, 42, 36, 58, 51, 70, 82] as const;

type AuthFeedback = {
  type: 'success' | 'error';
  message: string;
  previewUrl?: string | null;
  verificationUrl?: string | null;
};

// ─── Shared input component (with password toggle) ───
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
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      <label className="block text-[12px] font-medium text-[#6B7280] dark:text-gray-400 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`
            w-full px-3.5 py-2.5 rounded-lg
            border border-[#E5E7EB] dark:border-white/[0.1]
            bg-white dark:bg-[#1e1e2e]
            text-[14px] text-[#374151] dark:text-gray-100
            placeholder-[#C9CDD1] dark:placeholder-gray-600
            outline-none
            focus:border-[#9CA3AF] dark:focus:border-white/[0.2] focus:ring-2 focus:ring-[#9CA3AF]/10 dark:focus:ring-white/[0.05]
            ${isPassword ? 'pr-10' : ''}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="
              absolute right-2.5 top-1/2 -translate-y-1/2
              p-1 rounded-md
              text-[#9CA3AF] dark:text-gray-500
              hover:text-[#6B7280] dark:hover:text-gray-300
              hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
              transition-colors duration-150
            "
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function FeedbackBanner({ feedback }: { feedback: AuthFeedback | null }) {
  if (!feedback) {
    return null;
  }

  const isSuccess = feedback.type === 'success';
  const isPreviewMode = isSuccess && Boolean(feedback.previewUrl);
  const hasDevLink = isSuccess && !feedback.previewUrl && Boolean(feedback.verificationUrl);

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 text-[13px] leading-6 ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
      }`}
    >
      <p>{feedback.message}</p>
      {isPreviewMode && (
        <p className="mt-1 text-[12px] opacity-80">
          This app is using a development mail preview, so nothing was delivered to your real inbox.
        </p>
      )}
      {feedback.previewUrl && (
        <a
          href={feedback.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block font-medium underline underline-offset-2"
        >
          Open preview email
        </a>
      )}
      {hasDevLink && (
        <p className="mt-1 break-all text-[12px] opacity-80">
          Dev verify link: {feedback.verificationUrl}
        </p>
      )}
    </div>
  );
}

// ─── Sign In form (front) ───
function SignInForm({ onFlip, onSubmit, isLoading, feedback }: {
  onFlip: () => void;
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
  feedback: AuthFeedback | null;
}) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit && !isLoading) onSubmit(email, password);
  };

  return (
    <form onSubmit={handleForm} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-[20px] font-bold text-[#374151] dark:text-gray-100">Welcome back</h2>
        <p className="text-[14px] text-[#9CA3AF] dark:text-gray-500 mt-1">Sign in to continue to Analytixx</p>
      </div>

      <FeedbackBanner feedback={feedback} />

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
          bg-[#4B5563] dark:bg-white/[0.12] hover:bg-[#374151] dark:hover:bg-white/[0.18]
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
          className="text-[#374151] dark:text-gray-200 font-medium hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}

// ─── Sign Up form (back) ───
function SignUpForm({ onFlip, onSubmit, isLoading, feedback }: {
  onFlip: () => void;
  onSubmit: (name: string, email: string, password: string) => void;
  isLoading: boolean;
  feedback: AuthFeedback | null;
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
        <h2 className="text-[20px] font-bold text-[#374151] dark:text-gray-100">Create account</h2>
        <p className="text-[14px] text-[#9CA3AF] dark:text-gray-500 mt-1">Get started with Analytixx for free</p>
      </div>

      <FeedbackBanner feedback={feedback} />

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
          bg-[#4B5563] dark:bg-white/[0.12] hover:bg-[#374151] dark:hover:bg-white/[0.18]
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
          className="text-[#374151] dark:text-gray-200 font-medium hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

// ─── Main Auth View ───
export default function AuthView() {
  const { setAuthenticatedUser } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [signUpFormKey, setSignUpFormKey] = useState(0);

  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await signInWithEmail({ email, password });
      setAuthenticatedUser({
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.toLowerCase().includes('verify')
          ? 'Email not verified'
          : error instanceof Error
            ? error.message
            : 'Sign in failed.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await signUpWithEmail({ name, email, password });
      setFeedback({
        type: 'success',
        message: result.message,
        previewUrl: result.previewUrl ?? null,
        verificationUrl: result.verificationUrl ?? null,
      });
      setSignUpFormKey((value) => value + 1);
      setIsSignUp(false);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sign up failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showSignUp = useCallback(() => {
    setFeedback(null);
    setIsSignUp(true);
  }, []);

  const showSignIn = useCallback(() => {
    setFeedback(null);
    setIsSignUp(false);
  }, []);

  // Smooth theme toggle
  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('transitioning');
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setTimeout(() => root.classList.remove('transitioning'), 350);
  }, [theme, setTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="h-screen relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #070710 0%, #0d0d1a 25%, #121225 42%, #181830 55%, #1e1e3a 68%, #252540 80%, #2a2a45 92%, #2d2d4a 100%)'
          : 'linear-gradient(135deg, #111827 0%, #1e2a3a 28%, #374357 45%, #6b7a8d 58%, #a3b0bd 72%, #d1d7de 85%, #eef0f2 95%, #f5f6f8 100%)',
      }}
    >
      {/* ─── Ambient smoke blobs ─── */}
      <div className="smoke-container">
        <div className="smoke-blob smoke-blob--1" />
        <div className="smoke-blob smoke-blob--2" />
        <div className="smoke-blob smoke-blob--3" />
        <div className="smoke-blob smoke-blob--4" />
        <div className="smoke-blob smoke-blob--5" />
      </div>

      {/* ─── Canvas rain ─── */}
      <RainEffect />

      {/* ─── Theme toggle (fixed, always visible) ─── */}
      <div className="fixed top-4 right-4 md:top-5 md:right-6 z-30">
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
          transform: 'translateY(-50%) translateZ(0)',
          willChange: 'transform',
          width: '500px',
          height: '600px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ═══════════════════════════════════════════════════════════
          FULL-WIDTH SCROLL CONTAINER
          → scrollbar appears at RIGHT EDGE of screen
          → only left content creates height, right side is empty
          ═══════════════════════════════════════════════════════════ */}
      <div className="h-full overflow-y-auto relative z-10 auth-scroll-container">
        {/* Desktop: left content (only takes left half width) */}
        <div className="hidden lg:block lg:w-1/2 xl:w-[52%]">
          <div className="flex flex-col justify-between min-h-screen p-12 lg:p-16 text-white">
            {/* Top: Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                    <stop offset="50%" stopColor="#2563eb" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M25 65 Q 50 85 75 65" stroke="url(#wGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M35 72 Q 50 86 65 72" stroke="url(#wGrad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M25 80 L50 20 L75 80" stroke="url(#aGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="50" cy="55" r="14" fill="url(#cGrad)" />
              </svg>
              <span className="brand-wordmark text-[20px] font-semibold text-white tracking-tight">
                Analyti<span className="text-[#38bdf8]">xx</span>
              </span>
            </div>

            {/* Center: Content */}
            <div className="relative max-w-[560px] py-8">
              <div
                className="absolute -left-10 top-[4.5rem] h-56 w-56 rounded-full"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle, rgba(111, 144, 255, 0.18) 0%, rgba(111, 144, 255, 0) 72%)'
                    : 'radial-gradient(circle, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 72%)',
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.15] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                  Live analytics preview
                </div>

                <h1 className="brand-display mt-5 text-[36px] lg:text-[44px] font-bold leading-[0.92] text-white">
                  Turn your data into{' '}
                  <span className="bg-gradient-to-r from-white via-[#d9e3ff] to-[#8db8ff] bg-clip-text text-transparent">
                    insights
                  </span>
                  , instantly
                </h1>
                <p className="mt-4 max-w-[500px] text-[15px] leading-7 text-white/62">
                  Upload a dataset, ask a question in plain English, and watch Analytixx surface trends, top performers, and executive-ready answers in seconds.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative mt-10 overflow-hidden rounded-[30px] border border-white/12 bg-white/[0.12] p-5 shadow-[0_28px_80px_rgba(5,9,20,0.28)]"
              >
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
                <div className="absolute -right-12 top-10 h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(143,182,255,0.15) 0%, transparent 70%)' }} />
                <div className="absolute -left-10 bottom-4 h-36 w-36 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />

                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">Product Snapshot</p>
                    <h2 className="mt-2 text-[22px] font-bold tracking-[-0.04em] text-white">Your data, already making sense</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-medium text-emerald-100">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-300"
                      animate={{ opacity: [0.45, 1, 0.45], scale: [0.92, 1.15, 0.92] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    Streaming preview
                  </div>
                </div>

                <div className="relative mt-5 grid grid-cols-3 gap-3">
                  {PREVIEW_STATS.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + index * 0.08, duration: 0.4 }}
                      className="rounded-2xl border border-white/10 bg-black/[0.10] px-4 py-3"
                    >
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/42">{stat.label}</p>
                      <p className="mt-2 text-[21px] font-bold tracking-[-0.04em] text-white">{stat.value}</p>
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#c8f5d8]">
                        <ArrowUpRight className="h-3 w-3" />
                        {stat.change}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="relative mt-4 grid grid-cols-[minmax(0,1.45fr)_minmax(220px,0.95fr)] gap-3">
                  <div className="rounded-[24px] border border-white/10 bg-black/[0.12] p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/42">Revenue Trend</p>
                        <p className="mt-2 text-[16px] font-medium text-white/85">Monthly performance</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/58">
                        Last 7 months
                      </div>
                    </div>

                    <div className="mt-5 flex h-[150px] items-end gap-3">
                      {PREVIEW_BARS.map((height, index) => (
                        <div key={`${height}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="relative flex h-[118px] w-full items-end justify-center overflow-hidden rounded-t-[18px] rounded-b-[12px] bg-white/[0.05]">
                            <motion.div
                              className="w-full rounded-t-[18px] bg-gradient-to-t from-[#7da6ff] via-[#a8c5ff] to-white/90 shadow-[0_12px_30px_rgba(125,166,255,0.28)]"
                              style={{ height: `${height}%`, transformOrigin: 'bottom' }}
                              animate={{ scaleY: [0.82, 1, 0.88] }}
                              transition={{
                                duration: 2.6,
                                repeat: Infinity,
                                repeatType: 'mirror',
                                ease: 'easeInOut',
                                delay: index * 0.12,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/32">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/[0.14] p-4">
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/42">
                      <TrendingUp className="h-3.5 w-3.5 text-white/55" />
                      Insight Pulse
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/32">Forecast</p>
                        <p className="mt-1 text-[17px] font-bold tracking-[-0.03em] text-white">Q3 pacing ahead</p>
                        <p className="mt-1 text-[12px] leading-5 text-white/50">Revenue acceleration is strongest in the latest cohort.</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/32">Retention</p>
                        <p className="mt-1 text-[17px] font-bold tracking-[-0.03em] text-white">92% repeat intent</p>
                        <p className="mt-1 text-[12px] leading-5 text-white/50">Returning buyers are driving the biggest lift in margin.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.45 }}
                  className="relative mt-4 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4"
                >
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                    <Bot className="h-3.5 w-3.5 text-[#d4e2ff]" />
                    AI Query Demo
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/8 bg-black/[0.12] px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/32">User</p>
                    <p className="mt-2 text-[14px] font-medium text-white/88">&quot;Show monthly revenue trend&quot;</p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-[#8fb6ff]/18 bg-[#8fb6ff]/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#dbe7ff]">Analytixx</p>
                        <p className="mt-2 max-w-[260px] text-[13px] leading-6 text-white/84">
                          Revenue is trending upward with the sharpest jump in June and July, up <span className="font-bold text-white">18.2%</span> month over month.
                        </p>
                      </div>
                      <div className="flex h-14 min-w-[92px] items-end gap-1.5">
                        {QUERY_SPARKLINE.map((point, index) => (
                          <motion.div
                            key={`${point}-${index}`}
                            className="flex-1 rounded-full bg-gradient-to-t from-[#8fb6ff] to-white/90"
                            style={{ height: `${point}%` }}
                            animate={{ opacity: [0.52, 1, 0.72] }}
                            transition={{
                              duration: 1.9,
                              repeat: Infinity,
                              repeatType: 'mirror',
                              delay: index * 0.08,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="relative mt-4 grid grid-cols-3 gap-3">
                  {FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28 + index * 0.08, duration: 0.42 }}
                        className="rounded-2xl border border-white/10 bg-black/[0.10] px-4 py-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-white/72">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-[14px] font-medium text-white/88">{feature.title}</p>
                        <p className="mt-1 text-[12px] leading-5 text-white/48">{feature.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Bottom */}
            <p className="text-[12px] text-white/20 shrink-0 pb-4">
              &copy; 2026 Analytixx. All rights reserved.
            </p>
          </div>
        </div>

        {/* Mobile: full-width centered layout (no split) */}
        <div className="lg:hidden flex items-center justify-center min-h-screen px-6 py-12">
          <div className="w-full max-w-[400px]">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 justify-center">
              <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="aGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
                    <stop offset="50%" stopColor="#2563eb" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M25 65 Q 50 85 75 65" stroke="url(#wGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M35 72 Q 50 86 65 72" stroke="url(#wGrad)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M25 80 L50 20 L75 80" stroke="url(#aGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="50" cy="55" r="14" fill="url(#cGrad)" />
              </svg>
              <span className="brand-wordmark text-[22px] font-semibold text-white tracking-tight dark:text-gray-100">
                Analyti<span className="text-[#38bdf8]">xx</span>
              </span>
            </div>

            {/* Mobile feature list */}
            <div className="mb-8 text-center">
              <h2 className="brand-display text-[22px] font-bold leading-[0.98] text-white dark:text-gray-100">
                Turn your data into insights
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-white/60 dark:text-gray-400">
                Ask a question, preview the trend, and let Analytixx turn spreadsheets into decisions.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-left">
                {PREVIEW_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/[0.1] bg-white/[0.12] px-3 py-3"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/50">{stat.label}</p>
                    <p className="mt-1 text-[15px] font-bold tracking-[-0.03em] text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Flip Card */}
            <div style={{ perspective: '1200px' }}>
              <motion.div
                animate={{ rotateY: isSignUp ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: 'preserve-3d', display: 'grid', gridTemplate: '1fr / 1fr' }}
              >
                <div
                  className={`rounded-2xl p-6 ${isDark
                    ? 'bg-[#1a1a2e]/40 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-2xl'
                    : 'bg-white/60 border border-white/[0.4] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl'
                  }`}
                  style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  <SignInForm
                    onFlip={showSignUp}
                    onSubmit={handleSignIn}
                    isLoading={isLoading}
                    feedback={!isSignUp ? feedback : null}
                  />
                </div>
                <div
                  className={`rounded-2xl p-6 ${isDark
                    ? 'bg-[#1a1a2e]/40 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-2xl'
                    : 'bg-white/60 border border-white/[0.4] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl'
                  }`}
                  style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <SignUpForm
                    key={`mobile-signup-${signUpFormKey}`}
                    onFlip={showSignIn}
                    onSubmit={handleSignUp}
                    isLoading={isLoading}
                    feedback={isSignUp ? feedback : null}
                  />
                </div>
              </motion.div>
            </div>
            <p className={`text-center text-[12px] mt-8 ${isDark ? 'text-gray-500' : 'text-white/40'}`}>
              By continuing, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FIXED AUTH CARD (desktop only)
          → position: fixed, sibling of scroll container
          → wheel events on this do NOT reach the scroll container
          → card never moves, always vertically centered
          ═══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex fixed top-0 right-0 bottom-0 lg:w-1/2 xl:w-[48%] items-center justify-center z-20 pointer-events-none">
        <div className="w-full max-w-[400px] px-6 pointer-events-auto">
          {/* 3D Flip Card */}
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
                    ? 'bg-[#1a1a2e]/40 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-2xl'
                    : 'bg-white/60 border border-white/[0.4] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl'
                  }
                `}
                style={{
                  gridArea: '1 / 1',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <SignInForm
                  onFlip={showSignUp}
                  onSubmit={handleSignIn}
                  isLoading={isLoading}
                  feedback={!isSignUp ? feedback : null}
                />
              </div>

              {/* Back: Sign Up */}
              <div
                className={`
                  rounded-2xl p-6
                  ${isDark
                    ? 'bg-[#1a1a2e]/40 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-2xl'
                    : 'bg-white/60 border border-white/[0.4] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl'
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
                  key={`desktop-signup-${signUpFormKey}`}
                  onFlip={showSignIn}
                  onSubmit={handleSignUp}
                  isLoading={isLoading}
                  feedback={isSignUp ? feedback : null}
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
