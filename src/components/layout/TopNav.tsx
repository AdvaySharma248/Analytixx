'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function TopNav() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, setIsUploading, addDataset, setActiveDataset } = useAppStore();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-[1168px]">
      <nav className="flex items-center justify-between h-12 px-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-[#E8EAED] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
        {/* Left: Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[15px] font-semibold text-[#111827] tracking-tight">
            Data
          </span>
          <span className="text-[15px] font-semibold text-[#6366F1] tracking-tight">
            AI
          </span>
        </div>

        {/* Right: Upload + Avatar */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="h-8 px-3 rounded-lg text-[13px] font-medium text-[#6B7280] border-[#E8EAED] hover:bg-[#F7F8FA] hover:text-[#111827] gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[#6366F1]/10 text-[#6366F1] text-[11px] font-semibold rounded-lg">
              DA
            </AvatarFallback>
          </Avatar>
        </div>
      </nav>
    </header>
  );
}
