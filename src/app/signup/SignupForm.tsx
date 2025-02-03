'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  NAME_VALIDATION,
  EMAIL_VALIDATION,
  PASSWORD_VALIDATION,
  validateEmail,
  validatePassword,
  validateName,
} from '@/utils/validation';

// フォームの状態を管理するための型定義
type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
};

// エラー内容を表示
const ErrorDisplay = ({ error }: { error: string }) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-status-error-light border border-status-error-border text-status-error-dark px-4 py-3 rounded relative"
    >
      <p>{error}</p>
    </div>
  );
};

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email');
  const router = useRouter();

  // フォームの状態管理
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: initialEmail || '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    isLoading: false,
    error: null,
  });

  // 入力値の変更を処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      error: null,
    }));
  };

  // フォームの送信処理
  // - 入力値のバリデーション
  // - サインアップの実行
  // - サインアップ成功時はログインページへリダイレクト
  // - エラー発生時は適切なエラーメッセージを表示
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formState;

    setFormState((prev) => ({ ...prev, error: null, isLoading: true }));

    // パスワード一致の確認
    if (password !== confirmPassword) {
      setFormState((prev) => ({
        ...prev,
        error: '確認用パスワードが一致しません。',
        isLoading: false,
      }));
      return;
    }

    // 名前のバリデーションを追加
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      setFormState((prev) => ({
        ...prev,
        error: nameValidation.error || '名前が無効です',
        isLoading: false,
      }));
      return;
    }

    // メールアドレスのバリデーション
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setFormState((prev) => ({
        ...prev,
        error: emailValidation.error || 'メールアドレスが無効です',
        isLoading: false,
      }));
      return;
    }

    // パスワードのバリデーション
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setFormState((prev) => ({
        ...prev,
        error: passwordValidation.error || 'パスワードが無効です',
        isLoading: false,
      }));
      return;
    }
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウントの作成に失敗しました');
      }

      router.refresh();
      router.push(`/login?message=${encodeURIComponent(data.message)}`);
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'エラーが発生しました',
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const {
    name,
    email,
    password,
    confirmPassword,
    showPassword,
    isLoading,
    error,
  } = formState;

  return (
    <main className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h1 className="mt-6 text-center text-3xl font-semibold text-text-primary">
          Create an Account
        </h1>

        {/* サインアップフォーム */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* エラーメッセージ表示エリア */}
          {error && <ErrorDisplay error={error} />}

          <div className="rounded-md shadow-sm space-y-4">
            {/* 名前入力フィールド */}
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={handleChange}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Name (1-30 characters)"
                minLength={NAME_VALIDATION.MIN_LENGTH}
                maxLength={NAME_VALIDATION.MAX_LENGTH}
                pattern=".*\S+.*"
                disabled={isLoading}
              />
            </div>

            {/* メールアドレス入力フィールド */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              {/* 初期メールアドレスがある場合（ゲスト購入者がアカウントを作成する場合）は読み取り専用表示 */}
              {initialEmail ? (
                <div className="p-3 bg-background-primary text-text-primary rounded">
                  {initialEmail}
                  <input type="hidden" name="email" value={initialEmail} />
                </div>
              ) : (
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={EMAIL_VALIDATION.MAX_LENGTH}
                  pattern={EMAIL_VALIDATION.REGEX.source}
                  value={email}
                  onChange={handleChange}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email"
                  disabled={isLoading}
                />
              )}
            </div>

            {/* パスワード入力フィールド */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={PASSWORD_VALIDATION.MIN_LENGTH}
                pattern={PASSWORD_VALIDATION.PATTERN.source}
                value={password}
                onChange={handleChange}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
                disabled={isLoading}
              />

              {/* パスワード表示/非表示切り替えボタン */}
              <button
                type="button"
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    showPassword: !prev.showPassword,
                  }))
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
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
              className="mt-1 text-sm text-gray-400"
            >
              <p>Password requirements:</p>
              <ul className="list-disc list-inside">
                {PASSWORD_VALIDATION.REQUIREMENTS.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            {/* パスワード確認入力フィールド */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD_VALIDATION.MIN_LENGTH}
                pattern={PASSWORD_VALIDATION.PATTERN.source}
                value={confirmPassword}
                onChange={handleChange}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm Password"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 送信ボタン */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-text-primary bg-background-secondary shadow-md shadow-gray-700 duration-300 hover:translate-y-1 hover:shadow-none font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
              aria-live="polite"
            >
              {/* ローディング中の表示切り替え */}
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2
                    className="h-5 w-5 animate-spin mr-2"
                    aria-hidden="true"
                  />
                  Creating account...
                </div>
              ) : (
                'Sign up'
              )}
            </button>
          </div>

          {/* ログインページへのリンク */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-blue-500 hover:text-blue-400 text-sm"
            >
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
