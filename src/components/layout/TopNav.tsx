'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, UserPlus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function TopNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeDataset, setActiveDataset, isLoggedIn, setIsLoggedIn, reset } = useAppStore();

  // Logo click = go home / reset view
  const handleLogoClick = () => {
    setActiveDataset(null);
  };

  // Logout
  const handleLogout = () => {
    setDropdownOpen(false);
    setIsLoggedIn(false);
    reset();
  };

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

  if (!isLoggedIn) return null;

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-[1168px]">
      <nav className="flex items-center justify-between h-11 px-4 rounded-xl bg-white/90 backdrop-blur-xl border border-[#ECEDEE] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Clickable logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          <div className="w-6 h-6 rounded-md bg-[#111827] flex items-center justify-center">
            <span className="text-[11px] font-bold text-white leading-none">D</span>
          </div>
          <span className="text-[14px] font-semibold text-[#111827] tracking-tight">
            DataAI
          </span>
        </button>

        {/* Right: Profile avatar with dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-[#F5F6F7]"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-[#111827] text-white text-[10px] font-semibold rounded-lg">
                DA
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-xl border border-[#ECEDEE] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-[#F3F4F5]">
                  <p className="text-[13px] font-medium text-[#111827]">Demo User</p>
                  <p className="text-[11px] text-[#9CA3AF]">user@company.com</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#111827] transition-colors duration-150"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#6B7280] hover:bg-[#F5F6F7] hover:text-[#111827] transition-colors duration-150"
                  >
                    <UserPlus className="w-4 h-4" />
                    Switch Account
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-[#F3F4F5] py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#DC2626] hover:bg-red-50 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
}
