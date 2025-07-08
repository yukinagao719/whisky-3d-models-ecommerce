'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { EMAIL_VALIDATION, validateEmail } from '@/utils/validation';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // パスワードリセットフォームの送信処理
  // - 入力値のバリデーション
  // - リセットリクエストの実行
  // - エラー発生時は適切なエラーメッセージを表示
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // メールアドレスのバリデーション
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'メールアドレスが無効です');
      setIsLoading(false);
      return;
    }

    try {
      // リセットリクエストの送信
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワードリセットに失敗しました');
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-semibold text-text-primary">
            Reset Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your email address and we&apos;ll send you instructions to
            reset your password.
          </p>
        </div>

        {success ? (
          // 送信成功時の表示
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-status-success-light p-4"
          >
            <div className="flex">
              <div className="ml-3">
                <h2 className="text-sm font-medium text-status-success-dark">
                  Reset instructions sent!
                </h2>

                <div className="mt-2 text-sm text-status-success">
                  <p>
                    Please check your email for instructions to reset your
                    password.
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-status-success-dark hover:text-status-success"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // リセットリクエストフォーム（ポートフォリオサイトのため無効化）
          <div className="relative group">
            <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-6 opacity-50">
            {/* エラー表示 */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="bg-status-error-light border border-status-error-border text-status-error-dark px-4 py-3 rounded relative"
              >
                {error}
              </div>
            )}

            {/* メールアドレス入力フィールド */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                aria-label="パスワードリセットのためのメールアドレス"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={EMAIL_VALIDATION.MAX_LENGTH}
                pattern={EMAIL_VALIDATION.REGEX.source}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email"
                disabled={true}
              />
            </div>

            {/* 送信ボタン */}
            <div>
              <button
                type="submit"
                aria-live="polite"
                disabled={true}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-text-primary bg-background-secondary shadow-md shadow-gray-700 duration-300 hover:translate-y-1 hover:shadow-none font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2
                      className="h-5 w-5 animate-spin mr-2"
                      aria-hidden="true"
                    />
                    Sending...
                  </div>
                ) : (
                  'Send reset instructions'
                )}
              </button>
            </div>

            {/* ログインページへのリンク */}
            <div className="text-center">
              <Link
                href="/login"
                className="text-blue-500 hover:text-blue-400 text-sm"
              >
                Back to login
              </Link>
            </div>
          </form>
          
          {/* ツールチップ */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-3 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
            ポートフォリオサイトのためパスワードリセット機能は無効化されています
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
