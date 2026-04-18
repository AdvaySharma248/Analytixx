'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { Dataset } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export default function UploadBox() {
  const { addDataset, setActiveDataset, isUploading, setIsUploading } = useAppStore();
  const { toast } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file',
          description: 'Please upload a CSV file.',
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setUploadedFile(file.name);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 150);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Upload failed');
        }

        const dataset: Dataset = await res.json();

        clearInterval(progressInterval);
        setUploadProgress(100);

        setTimeout(() => {
          addDataset(dataset);
          setActiveDataset(dataset);
          setIsUploading(false);
          setUploadProgress(0);

          toast({
            title: 'Upload successful',
            description: `${dataset.filename} — ${dataset.rowCount} rows, ${dataset.columnCount} columns`,
          });
        }, 400);
      } catch (error) {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadedFile(null);

        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Something went wrong.',
          variant: 'destructive',
        });
      }
    },
    [addDataset, setActiveDataset, setIsUploading, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processFile]
  );

  const handleClear = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const isUploadingOrDone = isUploading || (uploadedFile && uploadProgress >= 100);

  return (
    <div
      className={cn(
        'relative bg-white border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer group',
        isDragging
          ? 'border-[#4F46E5] bg-[#EEF2FF]'
          : isUploadingOrDone
          ? 'border-[#D1FAE5] bg-[#F0FDF4]'
          : 'border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#FAFBFC]'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && !isUploadingOrDone && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag & drop idle state */}
      {!isUploading && !isUploadingOrDone && (
        <>
          <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#EEF2FF] transition-colors duration-200">
            <Upload className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#4F46E5] transition-colors duration-200" />
          </div>
          <p className="text-sm font-medium text-[#1F2937] mb-1">
            Drag & drop your CSV file here
          </p>
          <p className="text-[13px] text-[#9CA3AF] mb-4">or click to browse</p>
          <Button
            variant="outline"
            size="sm"
            className="text-[13px] border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            Select File
          </Button>
        </>
      )}

      {/* Uploading state */}
      {isUploading && !isUploadingOrDone && (
        <>
          <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-5 h-5 text-[#4F46E5] animate-pulse" />
          </div>
          <p className="text-sm font-medium text-[#1F2937] mb-1">
            Uploading {uploadedFile}...
          </p>
          <div className="max-w-[200px] mx-auto mt-3">
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        </>
      )}

      {/* Done state */}
      {isUploadingOrDone && (
        <>
          <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          </div>
          <p className="text-sm font-medium text-[#1F2937]">{uploadedFile}</p>
          <p className="text-[13px] text-[#10B981] mb-3">Uploaded successfully</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280]"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Upload another
          </Button>
        </>
      )}
    </div>
  );
}
