'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import {
  createInsightFromResponse,
  createQueryHistoryFromResponse,
  runDatasetQuery,
} from '@/lib/query';

const SUGGESTIONS = [
  'Revenue trend',
  'Top products',
  'Region performance',
  'Monthly comparison',
];

export default function HeroInput() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    isQuerying,
    setIsQuerying,
    activeDataset,
    addInsight,
    addQuery,
    setActiveSection,
  } = useAppStore();

  const hasDataset = !!activeDataset;
  const hasText = query.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasText || !hasDataset || isQuerying) return;

    const question = query.trim();
    setIsQuerying(true);

    try {
      const data = await runDatasetQuery(activeDataset!.id, question);
      addInsight(createInsightFromResponse(data, question));
      addQuery(createQueryHistoryFromResponse(data, question));
      setQuery('');
      setActiveSection('insights');
    } catch (error) {
      console.error('Query error:', error);
      toast.error(error instanceof Error ? error.message : 'Query failed');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (hasDataset) {
      inputRef.current?.focus();
    }
  }, [hasDataset]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 space-y-1.5 text-center">
        <p className="dashboard-section-kicker">{hasDataset ? 'Analysis' : 'Get Started'}</p>
        <h2 className="text-[22px] font-bold leading-tight text-[#111827] dark:text-gray-100">
          {hasDataset ? 'Ask your dataset a focused question' : 'Upload a dataset to start exploring'}
        </h2>
        <p className="mx-auto max-w-2xl text-[14px] leading-7 text-[#4B5563] dark:text-gray-300">
          {hasDataset
            ? 'Use natural language to generate sharper summaries, comparisons, and charts.'
            : 'Once a CSV is loaded, you can ask questions and turn the data into structured insights.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className={`
            relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300
            ${
              hasDataset
                ? 'border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] focus-within:border-[#9CA3AF] focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] dark:border-white/[0.08] dark:bg-[#1a1a28] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)] dark:focus-within:border-white/[0.15] dark:focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]'
                : 'cursor-not-allowed border-[#ECEDEE] bg-[#FAFAFB] opacity-50 dark:border-white/[0.06] dark:bg-white/[0.03]'
            }
          `}
        >
          <Sparkles className={`h-4 w-4 shrink-0 transition-colors duration-300 ${hasDataset ? 'text-[#4B5563] dark:text-gray-300' : 'text-[#9CA3AF] dark:text-gray-600'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hasDataset ? 'Ask anything about your data...' : 'Upload a CSV to unlock AI analysis'}
            disabled={!hasDataset || isQuerying}
            className="flex-1 bg-transparent text-[14px] font-normal text-[#111827] outline-none transition-colors duration-300 placeholder:text-[#6B7280] disabled:cursor-not-allowed dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          <AnimatePresence>
            {hasText && hasDataset && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                disabled={isQuerying}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#374151] transition-colors duration-200 hover:bg-[#111827] disabled:opacity-50 dark:bg-white/[0.12] dark:hover:bg-white/[0.18]"
              >
                {isQuerying ? (
                  <Loader2 className="h-3 w-3 animate-spin text-white dark:text-gray-200" />
                ) : (
                  <Send className="h-3 w-3 text-white dark:text-gray-200" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {!hasDataset && (
          <p className="text-[12px] leading-5 text-[#6B7280] dark:text-gray-400">
            Upload a dataset to start asking questions
          </p>
        )}
        {hasDataset && SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isQuerying}
            className="
              rounded-lg bg-[#F5F6F7] px-3 py-1.5 text-[12px] font-medium
              text-[#4B5563] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50
              hover:bg-[#ECEDEE] hover:text-[#111827] dark:bg-white/[0.06] dark:text-gray-300
              dark:hover:bg-white/[0.1] dark:hover:text-gray-100
            "
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
