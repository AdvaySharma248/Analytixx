'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Insight, QueryHistory } from '@/types';

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
  } = useAppStore();

  const hasDataset = !!activeDataset;
  const hasText = query.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasText || !hasDataset || isQuerying) return;

    const question = query.trim();
    setQuery('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: activeDataset!.id,
          question,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Query failed');
      }

      const data = await res.json();

      const insight: Insight = {
        id: data.id,
        datasetId: data.datasetId,
        query: question,
        title: data.title,
        summary: data.summary,
        chartType: data.chartType,
        chartData: data.chartData,
        createdAt: data.createdAt,
      };
      addInsight(insight);

      const history: QueryHistory = {
        id: data.queryId,
        datasetId: data.datasetId,
        question,
        response: data.summary,
        createdAt: data.createdAt,
      };
      addQuery(history);
    } catch (error) {
      console.error('Query error:', error);
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Input box */}
      <form onSubmit={handleSubmit}>
        <div
          className={`
            relative flex items-center gap-3 rounded-xl border px-4 py-3
            transition-all duration-300
            ${
              hasDataset
                ? 'bg-white dark:bg-[#1a1a28] border-[#ECEDEE] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)] focus-within:border-[#9CA3AF] dark:focus-within:border-white/[0.15] focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] dark:focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]'
                : 'bg-[#FAFAFB] dark:bg-white/[0.03] border-[#ECEDEE] dark:border-white/[0.06] opacity-50 cursor-not-allowed'
            }
          `}
        >
          <Sparkles className={`w-4 h-4 shrink-0 transition-colors duration-300 ${hasDataset ? 'text-[#6B7280] dark:text-gray-400' : 'text-[#C9CDD1] dark:text-gray-600'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your data..."
            disabled={!hasDataset || isQuerying}
            className="flex-1 bg-transparent text-[14px] text-[#111827] dark:text-gray-100 placeholder-[#C9CDD1] dark:placeholder-gray-600 outline-none disabled:cursor-not-allowed transition-colors duration-300"
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
                className="w-7 h-7 rounded-lg bg-[#374151] dark:bg-white/[0.12] hover:bg-[#111827] dark:hover:bg-white/[0.18] flex items-center justify-center shrink-0 transition-colors duration-200 disabled:opacity-50"
              >
                {isQuerying ? (
                  <Loader2 className="w-3 h-3 text-white dark:text-gray-200 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 text-white dark:text-gray-200" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Suggestion chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 justify-center">
        {!hasDataset && (
          <p className="text-[12px] text-[#C9CDD1] dark:text-gray-600 transition-colors duration-300">
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
              px-3 py-1 rounded-md text-[12px] font-medium
              bg-[#F5F6F7] dark:bg-white/[0.06] text-[#6B7280] dark:text-gray-400
              hover:bg-[#ECEDEE] dark:hover:bg-white/[0.1] hover:text-[#374151] dark:hover:text-gray-200
              transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none
            "
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
