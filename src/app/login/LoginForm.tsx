/**
 * ログインフォーム
 * - ソーシャルログイン（Google, GitHub）との連携
 * - メールアドレス/パスワードによる認証
 * - エラーハンドリングと通知表示
 * - チェックアウトフローからのリダイレクト対応
 */

'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import LoginButtons from '@/components/LoginButtons';
import {
  EMAIL_VALIDATION,
  validateEmail,
  validatePassword,
} from '@/utils/validation';

type MessageProps = {
  message: string;
};

type ErrorMessage = {
  title: string;
  message: string;
  action?: string;
};

// ログインフォームの状態を管理する型定義
type FormState = {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: ErrorMessage | null;
  message: string | null;
};

//メッセージ内容を表示
// - 成功通知やガイダンスメッセージを表示
// - 10秒後に自動的に非表示
const MessageDisplay = ({ message }: MessageProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-status-success-light border border-status-success-border text-status-success-dark px-4 py-3 rounded relative mb-4 text-center"
    >
      {message.split('\n').map((line, index) => (
        <p key={index} className={index > 0 ? 'mt-1' : ''}>
          {line}
        </p>
      ))}
    </div>
  );
};

// エラー内容を表示
// - エラーのタイトル、メッセージ、推奨アクションを表示
const ErrorDisplay = ({ error }: { error: ErrorMessage }) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-status-error-light border border-status-error-border text-status-error-dark px-4 py-3 rounded relative"
    >
      <h2 className="font-bold">{error.title}</h2>
      <p className="mt-1">{error.message}</p>
      {error.action && <p className="mt-1">{error.action}</p>}
    </div>
  );
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  // フォームの状態管理
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    showPassword: false,
    isLoading: false,
    error: null,
    message: null,
  });

  // エラータイプに応じたエラーメッセージを取得
  const getErrorMessage = (errorType: string): ErrorMessage => {
    const errorMessages: Record<string, ErrorMessage> = {
      // NextAuthの内部エラーは大文字ケース（CredentialsSignin, AccessDenied等）
      // カスタムエラーはスネークケース（system_error, invalid_input等）で統一
      CredentialsSignin: {
        title: '認証エラー',
        message: 'メールアドレスまたはパスワードが正しくありません。',
        action: '入力内容をご確認ください。',
      },
      AccessDenied: {
        title: '認証方法の不一致',
        message: 'このメールアドレスは既に別の認証方法で登録されています。',
        action: '前回使用した認証方法でログインしてください。',
      },
      OAuthAccountNotLinked: {
        title: '認証方法の不一致',
        message: 'このメールアドレスは既に別の認証方法で登録されています。',
        action: '前回使用した認証方法でログインしてください。',
      },
      invalid_input: {
        title: '入力エラー',
        message: 'メールアドレスかパスワードが間違っています。',
        action: '入力内容をご確認ください。',
      },
      system_error: {
        title: 'サーバーエラー',
        message: 'サーバーとの通信中にエラーが発生しました。',
        action: 'しばらく時間をおいて再度お試しください。',
      },
      Default: {
        title: 'エラーが発生しました',
        message: '予期せぬエラーが発生しました。',
        action: 'しばらく時間をおいて再度お試しください。',
      },
    };
    return errorMessages[errorType] || errorMessages.Default;
  };

  // URLクエリパラメータからメッセージを取得し、表示後にURLから削除
  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setFormState((prev) => ({ ...prev, message: urlMessage }));
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('message');
      const pathname = window.location.pathname;
      const newUrl = newSearchParams.toString()
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  // URLクエリパラメータからエラーを取得し、表示後にURLから削除
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setFormState((prev) => ({ ...prev, error: getErrorMessage(urlError) }));
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      const pathname = window.location.pathname;
      const newUrl = newSearchParams.toString()
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  // チェックアウトからのリダイレクト時の特別なメッセージ表示
  useEffect(() => {
    const redirect = searchParams.get('redirect');

    if (redirect === 'checkout') {
      setFormState((prev) => ({
        ...prev,
        message:
          'アカウントをお持ちの方は、\n' + 'ログインしてからご購入ください。',
      }));
    }
  }, [searchParams]);

  // ログインフォームの送信処理
  // - 入力値のバリデーション
  // - 認証処理の実行
  // - 認証成功時はコールバックURLへリダイレクト
  // - エラー発生時は適切なエラーメッセージを表示
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formState;

    setFormState((prev) => ({ ...prev, error: null, isLoading: true }));

    // メールアドレスのバリデーション
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setFormState((prev) => ({
        ...prev,
        error: getErrorMessage('invalid_input'),
        isLoading: false,
      }));
      return;
    }

    // パスワードのバリデーション
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setFormState((prev) => ({
        ...prev,
        error: getErrorMessage('invalid_input'),
        isLoading: false,
      }));
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result) {
        throw getErrorMessage('system_error');
      }

      if (result.error) {
        throw getErrorMessage(result.error);
      }

      if (result.ok) {
        await update();
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        router.push(callbackUrl);
      }
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? getErrorMessage('ServerError')
            : (error as ErrorMessage),
      }));
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const { email, password, showPassword, isLoading, error, message } =
    formState;

  return (
    <main className="flex items-center justify-center px-4 py-8 sm:py-16 container mx-auto">
      {/* ログインフォーム */}
      <section className="max-w-md w-full space-y-8">
        <h1 className="mt-6 text-center text-3xl font-semibold text-text-primary">
          Login
        </h1>

        {/* ソーシャルログインセクション */}
        <section aria-label="ソーシャルログイン">
          <LoginButtons />
        </section>

        {/* セパレーター - ソーシャルログインとメールログインの区切り */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-text-primary bg-background-primary">
              or
            </span>
          </div>
        </div>

        {/* メールログインフォーム */}
        <section aria-label="メールログイン">
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* エラーおよび通知メッセージの表示エリア */}
            {error && <ErrorDisplay error={error} />}
            {message && <MessageDisplay message={message} />}

            <div className="rounded-md shadow-sm space-y-4">
              {/* メールアドレス入力フィールド */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={EMAIL_VALIDATION.MAX_LENGTH}
                  pattern={EMAIL_VALIDATION.REGEX.source}
                  disabled={isLoading}
                  value={email}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: e.target.value,
                      error: null,
                    }))
                  }
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                  placeholder="Email"
                />
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
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      password: e.target.value,
                      error: null,
                    }))
                  }
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-600 bg-background-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                  placeholder="Password"
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
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
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
            </div>

            {/* 補助リンク - サインアップとパスワードリセット */}
            <div className="flex items-center justify-between text-sm">
              <Link
                href="/signup"
                className="text-blue-500 hover:text-blue-400"
              >
                Sign up
              </Link>
              <Link
                href="/password/reset"
                className="text-blue-500 hover:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>

            {/* 送信ボタン */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-text-primary bg-background-secondary shadow-md shadow-gray-700 duration-300 hover:translate-y-1 hover:shadow-none font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Login with Email'
                )}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
