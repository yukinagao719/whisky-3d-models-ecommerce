'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

type ProvidersProps = {
  children: React.ReactNode;
};

// 認証状態とトースト通知を提供するルートプロバイダー
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
}
