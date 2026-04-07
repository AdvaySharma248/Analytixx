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

  // Focus input when dataset becomes available
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
            relative flex items-center gap-3 rounded-[14px] border bg-white px-4 py-3.5
            transition-all duration-200
            ${
              hasDataset
                ? 'border-[#E8EAED] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] focus-within:border-[#6366F1]/40 focus-within:shadow-[0_2px_8px_rgba(99,102,241,0.06),0_8px_24px_rgba(99,102,241,0.08)]'
                : 'border-[#E8EAED] opacity-60 cursor-not-allowed bg-[#FAFAFB]'
            }
          `}
        >
          <Sparkles className={`w-5 h-5 shrink-0 ${hasDataset ? 'text-[#6366F1]' : 'text-[#9CA3AF]'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your data..."
            disabled={!hasDataset || isQuerying}
            className="flex-1 bg-transparent text-[15px] text-[#111827] placeholder-[#9CA3AF] outline-none disabled:cursor-not-allowed"
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
                className="w-8 h-8 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
              >
                {isQuerying ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Suggestion chips */}
      <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
        {!hasDataset && (
          <p className="text-[12px] text-[#9CA3AF]">
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
              px-3.5 py-1.5 rounded-full text-[13px] font-medium
              bg-[#F3F4F6] text-[#6B7280] hover:bg-[#6366F1]/10 hover:text-[#6366F1]
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
