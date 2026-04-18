'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpFromLine, Check, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

async function readUploadError(res: Response) {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const err = await res.json();
    return err.error || 'Upload failed';
  }

  const fallback = await res.text();
  if (res.status === 500 && fallback.toLowerCase().includes('internal server error')) {
    return 'Upload failed. Make sure the backend is running on http://127.0.0.1:4000.';
  }

  return fallback || `Upload failed with status ${res.status}`;
}

export default function UploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const {
    isUploading,
    setIsUploading,
    addDataset,
    setActiveDataset,
    activeDataset,
  } = useAppStore();

  const uploadFile = useCallback(async (file: File) => {
    setUploadError(null);

    if (!file.name.endsWith('.csv')) {
      setUploadError('Only CSV files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await readUploadError(res));
      }

      const dataset = await res.json();
      addDataset(dataset);
      setActiveDataset(dataset);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, addDataset, setActiveDataset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleChangeFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      {!activeDataset && (
        <div className="space-y-1.5 text-center">
          <p className="dashboard-section-kicker">Dataset</p>
          <h2 className="text-[22px] font-bold leading-tight text-[#111827] dark:text-gray-100">
            Upload your CSV
          </h2>
          <p className="text-[14px] leading-7 text-[#4B5563] dark:text-gray-300">
            Bring in a clean dataset to power the dashboard, charts, and AI analysis flow.
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence mode="wait">
        {activeDataset ? (
          <motion.div
            key="file-card"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#ECEDEE] bg-white px-4 py-3 transition-colors duration-300 dark:border-white/[0.08] dark:bg-[#1a1a28]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F6F7] transition-colors duration-300 dark:bg-white/[0.06]">
                <Check className="h-4 w-4 text-[#374151] transition-colors duration-300 dark:text-gray-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[#111827] transition-colors duration-300 dark:text-gray-100">
                  {activeDataset.filename}
                </p>
                <p className="mt-1 text-[12px] text-[#6B7280] transition-colors duration-300 dark:text-gray-400">
                  {activeDataset.rowCount.toLocaleString()} rows | {activeDataset.columnCount} columns
                </p>
              </div>
            </div>
            <button
              onClick={handleChangeFile}
              disabled={isUploading}
              className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#4B5563] transition-colors disabled:opacity-50 hover:text-[#111827] dark:text-gray-300 dark:hover:text-gray-100"
            >
              <RefreshCw className={`h-3 w-3 ${isUploading ? 'animate-spin' : ''}`} />
              Change
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={handleChangeFile}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200 ease-out
              ${
                isDragOver
                  ? 'border-[#9CA3AF]/50 bg-[#9CA3AF]/[0.02] dark:border-gray-500/50 dark:bg-gray-500/[0.03]'
                  : 'border-[#DDDEE0] bg-white hover:border-[#9CA3AF]/40 hover:bg-[#FAFAFB] dark:border-white/[0.1] dark:bg-[#1a1a28] dark:hover:border-gray-500/40 dark:hover:bg-white/[0.02]'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F6F7] transition-colors duration-200 dark:bg-white/[0.06]">
              <ArrowUpFromLine className={`h-4 w-4 transition-colors duration-200 ${isDragOver ? 'text-[#6B7280] dark:text-gray-400' : 'text-[#9CA3AF] dark:text-gray-500'}`} />
            </div>
            <p className="text-[15px] font-bold text-[#111827] transition-colors duration-300 dark:text-gray-100">
              {isUploading ? 'Uploading...' : 'Drop your dataset here or browse'}
            </p>
            <p className="text-[13px] text-[#4B5563] transition-colors duration-300 dark:text-gray-400">
              CSV files up to 10MB
            </p>
            {uploadError && (
              <p className="max-w-sm text-center text-[12px] leading-5 text-red-500 dark:text-red-400">
                {uploadError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
