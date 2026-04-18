'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { verifyEmailAddress } from '@/lib/auth-client';

type VerifyState = 'loading' | 'success' | 'error';

function VerifyPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-6 py-12 dark:bg-[#0d0d14]">
      <div className="w-full max-w-md rounded-3xl border border-[#ECEDEE] bg-white p-8 shadow-[0_12px_40px_rgba(17,24,39,0.08)] dark:border-white/[0.08] dark:bg-[#161623] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B7280] dark:text-gray-500">
          Email Verification
        </p>
        <h1 className="mt-3 text-[28px] font-bold text-[#111827] dark:text-gray-100">
          Checking your link
        </h1>
        <p className="mt-4 text-[14px] leading-7 text-[#4B5563] dark:text-gray-300">
          Verifying your email...
        </p>
      </div>
    </main>
  );
}

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  const token = searchParams.get('token');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    const verificationToken = token;

    let active = true;

    async function runVerification() {
      try {
        const result = await verifyEmailAddress(verificationToken);
        if (!active) {
          return;
        }

        setStatus('success');
        setMessage(result.message);
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Verification failed.');
      }
    }

    void runVerification();

    return () => {
      active = false;
    };
  }, [mounted, token]);

  if (!mounted) {
    return null;
  }

  const isSuccess = status === 'success';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-6 py-12 dark:bg-[#0d0d14]">
      <div className="w-full max-w-md rounded-3xl border border-[#ECEDEE] bg-white p-8 shadow-[0_12px_40px_rgba(17,24,39,0.08)] dark:border-white/[0.08] dark:bg-[#161623] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6B7280] dark:text-gray-500">
          Email Verification
        </p>
        <h1 className="mt-3 text-[28px] font-bold text-[#111827] dark:text-gray-100">
          {status === 'loading'
            ? 'Checking your link'
            : isSuccess
              ? 'Email verified'
              : 'Verification failed'}
        </h1>
        <p
          className={`mt-4 text-[14px] leading-7 ${
            isSuccess
              ? 'text-emerald-700 dark:text-emerald-300'
              : status === 'error'
                ? 'text-red-600 dark:text-red-300'
                : 'text-[#4B5563] dark:text-gray-300'
          }`}
        >
          {message}
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#111827] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1f2937] dark:bg-white/[0.12] dark:hover:bg-white/[0.18]"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyPageFallback />}>
      <VerifyPageContent />
    </Suspense>
  );
}
