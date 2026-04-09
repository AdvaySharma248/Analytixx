'use client';

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, UserPlus, Moon, Sun, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';

export default function TopNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const {
    activeDataset,
    setActiveDataset,
    isLoggedIn,
    setIsLoggedIn,
    setCurrentView,
    reset,
    userName,
    userEmail,
  } = useAppStore();



  // Logo click = go home / reset view
  const handleLogoClick = () => {
    setActiveDataset(null);
    setCurrentView('dashboard');
  };

  // Profile → navigate to profile view
  const handleProfile = useCallback(() => {
    setDropdownOpen(false);
    setCurrentView('profile');
    toast.success('Viewing profile', { duration: 1500 });
  }, [setCurrentView]);

  // Switch Account → clear session → login
  const handleSwitchAccount = useCallback(() => {
    setDropdownOpen(false);
    toast.success('Account switched', {
      description: 'Redirecting to login...',
      duration: 2000,
    });
    setTimeout(() => {
      setIsLoggedIn(false);
      reset();
    }, 800);
  }, [setIsLoggedIn, reset]);

  // Sign Out → clear auth + state → login
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

  // Toggle dark mode with smooth transition
  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('transitioning');

    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    toast.info(newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', {
      duration: 1500,
    });

    // Remove transitioning class after animation completes
    setTimeout(() => {
      root.classList.remove('transitioning');
    }, 350);
  }, [theme, setTheme]);

  // Click outside to close dropdown
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

  // Keyboard: Escape closes dropdown
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
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-[1168px]">
      <nav className="flex items-center justify-between h-11 px-4 rounded-xl bg-white/90 dark:bg-[#1a1a28]/90 backdrop-blur-xl border border-[#ECEDEE] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
        {/* Left: Clickable logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          <div className="w-6 h-6 rounded-md bg-[#111827] dark:bg-white/10 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white dark:text-white/90 leading-none">D</span>
          </div>
          <span className="text-[14px] font-semibold text-[#111827] dark:text-gray-100 tracking-tight">
            DataAI
          </span>
        </button>

        {/* Right: Dark mode toggle + Profile avatar */}
        <div className="flex items-center gap-1">
          {/* Dark mode toggle */}
          {mounted && (
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.92 }}
              className="
                h-8 w-8 rounded-lg flex items-center justify-center
                text-[#6B7280] dark:text-gray-400
                hover:bg-[#F5F6F7] dark:hover:bg-white/[0.06]
              "
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

          {/* Divider */}
          <div className="w-px h-4 bg-[#ECEDEE] dark:bg-white/[0.08] mx-1" />

          {/* Profile avatar with dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="h-8 pl-1.5 pr-2 rounded-lg flex items-center gap-2 hover:bg-[#F5F6F7] dark:hover:bg-white/[0.06]"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-[#111827] dark:bg-white/10 text-white dark:text-white/90 text-[9px] font-semibold rounded-md">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className={`w-3 h-3 text-[#9CA3AF] dark:text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-0 top-full mt-2 w-[220px] bg-white dark:bg-[#1e1e2e] rounded-xl border border-[#ECEDEE] dark:border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-[#F3F4F5] dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-[#111827] dark:bg-white/10 text-white dark:text-white/90 text-[10px] font-semibold rounded-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#111827] dark:text-gray-100 truncate">{displayName}</p>
                        <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 truncate">{displayEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={handleProfile}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#6B7280] dark:text-gray-400 hover:bg-[#F5F6F7] dark:hover:bg-white/[0.04] hover:text-[#111827] dark:hover:text-gray-100"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={handleSwitchAccount}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#6B7280] dark:text-gray-400 hover:bg-[#F5F6F7] dark:hover:bg-white/[0.04] hover:text-[#111827] dark:hover:text-gray-100"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Switch Account</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[#F3F4F5] dark:border-white/[0.06] py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#DC2626] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
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
