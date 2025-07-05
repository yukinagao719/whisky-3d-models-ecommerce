'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { PASSWORD_VALIDATION, validatePassword } from '@/utils/validation';

type ConfirmPasswordResetPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function ConfirmPasswordResetPage({
  params,
}: ConfirmPasswordResetPageProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // パスワードリセット確定フォームの送信処理
  // - 入力値のバリデーション
  // - パスワードリセットの実行
  // - リセット成功時はログインページへリダイレクト
  // - エラー発生時は適切なエラーメッセージを表示
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // パスワード一致の確認
    if (password !== confirmPassword) {
      setError('確認用パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    // パスワードのバリデーション
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'パスワードが無効です');
      setIsLoading(false);
      return;
    }

    try {
      const resolvedParams = await params;
      // パスワードリセットの実行
      const response = await fetch('/api/auth/password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resolvedParams.token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワードリセットに失敗しました');
      }

      setSuccess(true);
      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-semibold text-text-primary">
            Reset Your Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Please enter your new password.
          </p>
        </div>

        {success ? (
          // リセット成功時の表示
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-green-50 p-4"
          >
            <div className="flex">
              <div className="ml-3">
                <h2 className="text-sm font-medium text-green-800">
                  Password reset successful!
                </h2>
                <div className="mt-2 text-sm text-green-700">
                  <p>You will be redirected to the login page shortly.</p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-green-800 hover:text-green-700"
                  >
                    Go to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // パスワードリセットフォーム
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* エラー表示 */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-status-error-light border border-status-error-border text-status-error-dark px-4 py-3 rounded relative"
              >
                {error}
              </div>
            )}

            {/* 新しいパスワード入力フィールド */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary pb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={PASSWORD_VALIDATION.MIN_LENGTH}
                  pattern={PASSWORD_VALIDATION.PATTERN.source}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                  disabled={isLoading}
                />

                {/* パスワード表示/非表示切り替えボタン */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  aria-label={
                    showPassword ? 'パスワードを隠す' : 'パスワードを表示'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* パスワード要件説明 */}
              <div
                aria-label="パスワード要件"
                className="mt-1 py-2 text-sm text-gray-400"
              >
                <p>Password requirements:</p>
                <ul className="list-disc list-inside">
                  {PASSWORD_VALIDATION.REQUIREMENTS.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* パスワード確認入力フィールド */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary pb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={PASSWORD_VALIDATION.MIN_LENGTH}
                pattern={PASSWORD_VALIDATION.PATTERN.source}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm new password"
                disabled={isLoading}
              />
            </div>

            {/* 送信ボタン */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-text-primary bg-background-secondary shadow-md shadow-gray-700 duration-300 hover:translate-y-1 hover:shadow-none font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                aria-live="polite"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2
                      className="h-5 w-5 animate-spin mr-2"
                      aria-hidden="true"
                    />
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
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
        )}
      </div>
    </main>
  );
}
