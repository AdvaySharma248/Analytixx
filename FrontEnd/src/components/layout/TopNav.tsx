'use client';

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Moon, Sun, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';

export default function TopNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const {
    setActiveDataset,
    isLoggedIn,
    setIsLoggedIn,
    setCurrentView,
    reset,
    userName,
    userEmail,
  } = useAppStore();

  const handleLogoClick = () => {
    setActiveDataset(null);
    setCurrentView('dashboard');
  };

  const handleProfile = useCallback(() => {
    setDropdownOpen(false);
    setCurrentView('profile');
    toast.success('Viewing profile', { duration: 1500 });
  }, [setCurrentView]);


  const handleLogout = useCallback(() => {
    setDropdownOpen(false);
    toast.success('Signed out', {
      description: 'See you next time!',
      duration: 2000,
    });
    setTimeout(() => {
      setIsLoggedIn(false);
      reset();
    }, 800);
  }, [setIsLoggedIn, reset]);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('transitioning');

    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    setTimeout(() => {
      root.classList.remove('transitioning');
    }, 350);
  }, [theme, setTheme]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && dropdownOpen) setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen]);

  if (!isLoggedIn) return null;

  const displayName = userName || 'Demo User';
  const displayEmail = userEmail || 'user@company.com';
  const initials = displayName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-3rem)] max-w-[1168px] -translate-x-1/2">
      <nav className="flex h-11 items-center justify-between rounded-xl border border-[#ECEDEE] bg-white/90 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#1a1a28]/90 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
        <button
          onClick={handleLogoClick}
          className="flex shrink-0 cursor-pointer items-center gap-2 transition-opacity duration-200 hover:opacity-80"
        >
          <svg className="w-7 h-7 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span className="brand-wordmark text-[17px] font-semibold tracking-tight text-[#111827] dark:text-white">
            Analyti<span className="text-[#38bdf8]">xx</span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          {mounted && (
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.92 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#4B5563] hover:bg-[#F5F6F7] dark:text-gray-300 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          <div className="mx-1 h-4 w-px bg-[#ECEDEE] dark:bg-white/[0.08]" />

          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-8 items-center gap-2 rounded-lg pl-1.5 pr-2 hover:bg-[#F5F6F7] dark:hover:bg-white/[0.06]"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="rounded-md bg-[#111827] text-[9px] font-semibold text-white dark:bg-white/10 dark:text-white/90">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className={`h-3 w-3 text-[#6B7280] transition-transform duration-200 dark:text-gray-400 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-0 top-full mt-2 w-[220px] overflow-hidden rounded-xl border border-[#ECEDEE] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:border-white/[0.08] dark:bg-[#1e1e2e] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                >
                  <div className="border-b border-[#F3F4F5] px-4 py-3 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="rounded-lg bg-[#111827] text-[10px] font-semibold text-white dark:bg-white/10 dark:text-white/90">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-[#111827] dark:text-gray-100">
                          {displayName}
                        </p>
                        <p className="truncate text-[12px] text-[#6B7280] dark:text-gray-400">
                          {displayEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleProfile}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#4B5563] hover:bg-[#F5F6F7] hover:text-[#111827] dark:text-gray-300 dark:hover:bg-white/[0.04] dark:hover:text-gray-100"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                  </div>

                  <div className="border-t border-[#F3F4F5] py-1 dark:border-white/[0.06]">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[#DC2626] hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
