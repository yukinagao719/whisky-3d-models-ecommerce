'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type VerifyEmailPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function EmailVerificationPage({
  params,
}: VerifyEmailPageProps) {
  const resolvedParams = await params;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      setIsLoading(true);
      setError(null);

      // 認証トークンのチェック
      if (!resolvedParams.token) {
        setError('無効な認証トークンです');
        setIsLoading(false);
        return;
      }

      try {
        // トークンを検証
        const response = await fetch('/api/auth/email/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: resolvedParams.token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'メール認証に失敗しました');
        }

        setSuccess(true);
        // 1.5秒後にログインページへリダイレクト
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 1500);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'エラーが発生しました'
        );
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [resolvedParams.token, router]);

  return (
    <main className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-semibold text-text-primary">
            Email Verification
          </h1>
        </div>

        {/* 認証成功時のメッセージ */}
        {success && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-status-success-light p-4"
          >
            <div className="flex">
              <CheckCircle
                className="h-5 w-5 text-status-success-dark"
                aria-hidden="true"
              />

              <div className="ml-3">
                <h2 className="text-sm font-medium text-status-success-dark">
                  Email Verified Successfully
                </h2>
                <div className="mt-2 text-sm text-status-success">
                  <p>Redirecting to login page...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div className="flex flex-col items-center">
            <Loader2
              className="h-8 w-8 animate-spin text-accent-dark"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm text-gray-400">
              Verifying your email address...
            </p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div>
            <div
              role="alert"
              aria-live="polite"
              className="bg-status-error-light border border-status-error-border text-status-error-dark px-4 py-3 rounded relative"
            >
              {error}
            </div>
            {/* ログインページへのリンク */}
            <div className="mt-4">
              <Link
                href="/login"
                className="text-blue-500 hover:text-blue-400 text-sm"
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
