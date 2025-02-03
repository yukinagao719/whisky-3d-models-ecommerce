'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleIcon from '@/components/icons/GoogleIcon';
import GitHubIcon from '@/components/icons/GithubIcon';
import { useCartStore } from '@/store/cartStore';

type Provider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

type ErrorMessage = {
  title: string;
  message: string;
  action?: string;
};

export default function LoginButtons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthRedirect = useCartStore((state) => state.setAuthRedirect);
  const [providers, setProviders] = useState<Record<string, Provider> | null>(
    null
  );
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<ErrorMessage | null>(null);

  // 認証プロバイダー一覧の取得と初期化
  useEffect(() => {
    const setupProviders = async () => {
      try {
        const providers = await getProviders();
        setProviders(providers);
      } catch {
        setError({
          title: '認証エラー',
          message: '認証の準備に失敗しました',
          action: 'ページを再読み込みしてください',
        });
      }
    };

    setupProviders();
  }, []);

  // プロバイダーIDに対応するアイコンを取得
  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return GoogleIcon;
      case 'github':
        return GitHubIcon;
      default:
        return null;
    }
  };

  // OAuth認証の実行とリダイレクト処理
  // - チェックアウトフローの場合は特別な処理を実行
  // - エラー発生時はログインページにリダイレクト
  const handleOAuthSignIn = async (providerId: string) => {
    try {
      setLoadingProvider(providerId);
      setError(null);

      // 既存ユーザーが未ログインでチェックアウトする際のリダイレクト処理（OAuth認証）
      if (searchParams.get('redirect') === 'checkout') {
        setAuthRedirect('checkout-init');
        const result = await signIn(providerId, {
          callbackUrl: '/auth/callback',
          redirect: false,
        });

        if (result?.error) {
          router.push(`/login?error=${encodeURIComponent(result.error)}`);
        }
      } else {
        // 通常のログインの場合
        const result = await signIn(providerId, {
          callbackUrl: '/',
          redirect: false,
        });

        if (result?.error) {
          router.push(`/login?error=${encodeURIComponent(result.error)}`);
        } else if (result?.ok) {
          router.push(result.url || '/');
        }
      }
    } catch {
      router.push('/login?error=system_error');
    } finally {
      setLoadingProvider(null);
    }
  };

  // エラー内容を表示;
  if (error) {
    return (
      <div
        role="alert"
        className="bg-status-error-light border border-status-error-border text-status-error-dark px-4 py-3 rounded relative"
      >
        <h1 className="font-bold">{error.title}</h1>
        <p className="mt-1">{error.message}</p>
        {error.action && <p className="mt-1">{error.action}</p>}
      </div>
    );
  }

  // プロバイダーボタンの表示
  return (
    <nav aria-label="ソーシャルログイン" className="mt-8 space-y-6">
      {providers &&
        Object.values(providers).map((provider) => {
          const IconComponent = getProviderIcon(provider.id);
          if (!IconComponent || provider.id === 'credentials') return null;

          const isProviderLoading = loadingProvider === provider.id;

          return (
            <div key={provider.id} className="text-center">
              <button
                aria-label={`${provider.name}でログイン`}
                onClick={() => handleOAuthSignIn(provider.id)}
                disabled={loadingProvider !== null}
                className="bg-background-secondary shadow-md shadow-gray-700 duration-300 hover:translate-y-1 hover:shadow-none text-text-primary font-bold py-2 px-4 rounded flex items-center justify-center w-full disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <IconComponent aria-hidden="true" />

                <span className="ml-5">
                  {isProviderLoading
                    ? `Logging in with ${provider.name}...`
                    : `Login with ${provider.name}`}
                </span>
              </button>
            </div>
          );
        })}
    </nav>
  );
}
