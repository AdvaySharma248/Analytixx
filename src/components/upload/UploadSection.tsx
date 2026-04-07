'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpFromLine, Check, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function UploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const {
    isUploading,
    setIsUploading,
    addDataset,
    setActiveDataset,
    activeDataset,
  } = useAppStore();

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      console.error('Only CSV files are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      console.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const dataset = await res.json();
      addDataset(dataset);
      setActiveDataset(dataset);
    } catch (error) {
      console.error('Upload error:', error);
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
    <div className="w-full max-w-xl mx-auto">
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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white rounded-2xl border border-[#E8EAED] px-5 py-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[#111827] truncate">
                  {activeDataset.filename}
                </p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  {activeDataset.rowCount.toLocaleString()} rows · {activeDataset.columnCount} columns
                </p>
              </div>
            </div>
            <button
              onClick={handleChangeFile}
              disabled={isUploading}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#6366F1] hover:text-[#4F46E5] shrink-0 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
              Change file
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={handleChangeFile}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed px-8 py-14
              flex flex-col items-center justify-center gap-3
              transition-all duration-200 ease-out
              ${
                isDragOver
                  ? 'border-[#6366F1]/50 bg-[#6366F1]/[0.03]'
                  : 'border-[#E0E2E6] bg-white hover:border-[#6366F1]/30 hover:bg-[#F7F8FA]'
              }
              ${isUploading ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <div className={`
              w-11 h-11 rounded-2xl flex items-center justify-center mb-1
              transition-colors duration-200
              ${isDragOver ? 'bg-[#6366F1]/10' : 'bg-[#F7F8FA]'}
            `}>
              <ArrowUpFromLine className={`w-5 h-5 transition-colors duration-200 ${isDragOver ? 'text-[#6366F1]' : 'text-[#9CA3AF]'}`} />
            </div>
            <p className="text-[15px] font-medium text-[#6B7280]">
              {isUploading ? 'Uploading...' : 'Drop your dataset here or browse'}
            </p>
            <p className="text-[12px] text-[#9CA3AF]">
              Supports CSV files up to 10MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
