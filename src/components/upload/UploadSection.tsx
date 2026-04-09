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
    <div className="w-full max-w-lg mx-auto">
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
            className="bg-white rounded-xl border border-[#ECEDEE] px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#F5F6F7] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[#374151]" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#111827] truncate">
                  {activeDataset.filename}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {activeDataset.rowCount.toLocaleString()} rows · {activeDataset.columnCount} columns
                </p>
              </div>
            </div>
            <button
              onClick={handleChangeFile}
              disabled={isUploading}
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280] hover:text-[#374151] shrink-0 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
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
              relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-10
              flex flex-col items-center justify-center gap-2.5
              transition-all duration-200 ease-out
              ${
                isDragOver
                  ? 'border-[#9CA3AF]/50 bg-[#9CA3AF]/[0.02]'
                  : 'border-[#DDDEE0] bg-white hover:border-[#9CA3AF]/40 hover:bg-[#FAFAFB]'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              transition-colors duration-200
              ${isDragOver ? 'bg-[#F5F6F7]' : 'bg-[#F5F6F7]'}
            `}>
              <ArrowUpFromLine className={`w-4 h-4 transition-colors duration-200 ${isDragOver ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`} />
            </div>
            <p className="text-[14px] font-medium text-[#6B7280]">
              {isUploading ? 'Uploading...' : 'Drop your dataset here or browse'}
            </p>
            <p className="text-[12px] text-[#C9CDD1]">
              CSV files up to 10MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
