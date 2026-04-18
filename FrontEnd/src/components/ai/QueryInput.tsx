'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  createInsightFromResponse,
  createQueryHistoryFromResponse,
  runDatasetQuery,
} from '@/lib/query';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';

const suggestions = [
  'Show monthly revenue',
  'Top 5 products',
  'Sales trend over time',
  'Revenue by category',
  'Compare quarterly performance',
];

export default function QueryInput() {
  const {
    activeDataset,
    isQuerying,
    setIsQuerying,
    addInsight,
    addQuery,
    setActiveSection,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed || !activeDataset || isQuerying) return;

      setIsQuerying(true);

      try {
        const data = await runDatasetQuery(activeDataset.id, trimmed);
        addInsight(createInsightFromResponse(data, trimmed));
        addQuery(createQueryHistoryFromResponse(data, trimmed));

        setQuery('');
        setActiveSection('insights');
      } catch (error) {
        console.error('Query error:', error);
        toast.error(error instanceof Error ? error.message : 'Query failed');
      } finally {
        setIsQuerying(false);
      }
    },
    [query, activeDataset, isQuerying, setIsQuerying, addInsight, addQuery, setActiveSection]
  );

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const hasDataset = !!activeDataset;

  return (
    <div
      className={cn(
        'bg-white border border-[#E5E7EB] rounded-xl transition-all duration-200',
        hasDataset ? '' : 'opacity-60'
      )}
    >
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center gap-3">
          {!isQuerying && (
            <Sparkles className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          )}
          {isQuerying && (
            <Loader2 className="w-4 h-4 text-[#4F46E5] shrink-0 animate-spin" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              hasDataset
                ? 'Ask something about your data...'
                : 'Upload a CSV file first to start asking questions'
            }
            disabled={!hasDataset || isQuerying}
            className={cn(
              'flex-1 text-sm bg-transparent outline-none placeholder:text-[#9CA3AF] text-[#1F2937] disabled:cursor-not-allowed'
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!hasDataset || !query.trim() || isQuerying}
            className="h-8 w-8 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-40 shrink-0 transition-colors duration-150"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Suggestion chips */}
        {hasDataset && !isQuerying && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="text-[12px] px-2.5 py-1 bg-[#F3F4F6] text-[#6B7280] rounded-full hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-colors duration-150 whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
