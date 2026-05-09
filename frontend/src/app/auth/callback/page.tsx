'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, setToken } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FullPageSpinner } from '@/components/ui/spinner';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No authentication token received. Please try again.');
      setTimeout(() => router.replace('/'), 3000);
      return;
    }

    // Store token and fetch user
    setToken(token);
    api
      .getMe()
      .then(async () => {
        await refreshUser();
        router.replace('/dashboard');
      })
      .catch((err: Error) => {
        setError(err.message || 'Authentication failed. Please try again.');
        setTimeout(() => router.replace('/'), 3000);
      });
  }, [searchParams, router, refreshUser]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <span className="text-4xl" aria-hidden="true">⚠</span>
          <h2 className="font-serif text-xl text-danger font-bold tracking-widest uppercase">
            Authentication Failed
          </h2>
          <p className="text-muted font-mono text-sm">{error}</p>
          <p className="text-muted font-mono text-xs">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-6">
        <FullPageSpinner />
        <div className="text-center space-y-1">
          <p className="font-serif text-foreground text-lg">Verifying credentials...</p>
          <p className="font-mono text-muted text-xs tracking-widest uppercase">
            Welcome to the precinct, Detective
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
