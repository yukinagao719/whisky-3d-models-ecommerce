/**
 * ショッピングカートページ
 * - 商品の表示、削除
 * - 金額計算（税込）
 * - Stripe決済への連携
 * - 未ログインユーザーのチェックアウトフロー
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { getStripePromise } from '@/lib/stripe-client';
import { capitalize } from '@/utils/string';
import { DEFAULT_PATHS } from '@/lib/constants';
import { getAssetUrl } from '@/lib/assetHelpers';
import { EMAIL_VALIDATION, validateEmail } from '@/utils/validation';

// トースト通知の共通設定
const TOAST_CONFIG = {
  duration: 5000,
} as const;

export default function CartPage() {
  const { items, removeItem, getTotal } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  // 購入済み商品をカートから自動削除し、ユーザーに通知
  // - ログイン時に未ログイン時にカートに入れた商品の購入履歴を確認
  useEffect(() => {
    const initializeCart = async () => {
      if (status === 'authenticated' && session?.user.id) {
        try {
          // useEffect内での非同期処理とコンポーネントのライフサイクルを考慮して
          // getState()を直接使用しています。これにより、ストアの状態を安全に取得し、
          // 購入済み商品の削除を確実に行うことを想定

          const removedItems = await useCartStore
            .getState()
            .removePurchasedItems();

          if (removedItems && removedItems.length > 0) {
            const itemNames = removedItems.map((item) => item.name).join(', ');
            throw new Error(`${itemNames}は既に購入済みです。`);
          }
        } catch (error) {
          // 購入済み商品の通知の場合
          if (error instanceof Error && error.message.includes('購入済み')) {
            toast.warning('購入済み商品をカートから削除しました', {
              description: error.message,
              ...TOAST_CONFIG,
              id: `removed-items-${session?.user.id}`,
            });
          } else {
            toast.error(
              error instanceof Error ? error.message : 'エラーが発生しました',
              TOAST_CONFIG
            );
          }
        }
      }
      setIsLoading(false);
    };

    initializeCart();
  }, [status, session?.user.id]);

  // Stripeチェックアウトセッションの作成と決済ページへのリダイレクト
  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const stripe = await getStripePromise();
      if (!stripe) {
        throw new Error('予期せぬエラーが発生しました');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          email: session?.user.email || email || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済処理の開始に失敗しました');
      }

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result.error) {
        throw new Error(
          result.error.message || '決済ページへの遷移に失敗しました'
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '予期せぬエラーが発生しました',
        TOAST_CONFIG
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 未ログインユーザー用のフォーム送信処理
  const handleGuestCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // メールアドレスの入力チェック
      if (!email) {
        throw new Error('メールアドレスを入力してください');
      }

      // メールアドレスのバリデーション
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error || 'メールアドレスが無効です');
      }

      // 既存ユーザーチェック
      const response = await fetch('/api/auth/email/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'メールアドレスの確認に失敗しました');
      }

      if (data.exists) {
        setIsLoading(true);
        router.push(`/login?redirect=checkout&callbackUrl=/cart`);
        return;
      }

      // 未登録ユーザーの場合はチェックアウトへ
      await handleCheckout();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'エラーが発生しました',
        TOAST_CONFIG
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // グローバルローディング：認証状態の初期化とカートの初期化が完了するまでの表示
  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Loader2
          className="w-8 h-8 animate-spin text-accent-dark"
          aria-hidden="true"
        />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold mb-10 text-text-primary">
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        // カートが空の場合
        <section
          aria-label="カートが空です"
          className="flex flex-col items-center justify-center py-20 bg-background-secondary rounded-lg"
        >
          <p className="text-xl text-text-primary mb-6">Your cart is empty</p>
          <Link
            href="/"
            className="px-6 py-3 bg-accent-dark hover:bg-accent-light transition-colors rounded-lg text-text-primary"
          >
            Continue Shopping
          </Link>
        </section>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 商品リスト */}
          <section aria-label="カート内の商品" className="lg:w-2/3 space-y-6">
            {items.map((item, index) => (
              <article
                key={item.id}
                className="flex flex-col sm:flex-row gap-6 p-6 bg-background-secondary rounded-lg transition-transform hover:scale-[1.02]"
              >
                <div
                  aria-label={`${item.name}の商品画像`}
                  role="image"
                  className="w-full sm:w-48 aspect-square relative rounded-lg overflow-hidden"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.nameEn}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover"
                    priority={index < 3}
                    loading={index < 3 ? undefined : 'lazy'}
                    onError={(e) => {
                      const image = e.target as HTMLImageElement;
                      image.src = getAssetUrl(DEFAULT_PATHS.productImage) || '';
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-text-primary">
                      {item.name}
                    </h3>
                    <p className="text-text-primary text-md mb-2">
                      {capitalize(item.nameEn)}
                    </p>
                    <button
                      aria-label={`${item.name}をカートから削除`}
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-lg font-medium text-text-primary">
                      ¥{item.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* 注文サマリー */}
          <aside aria-label="注文の概要" className="lg:w-1/3">
            <div className="bg-background-secondary rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-700 text-text-primary">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-text-primary">
                  <span>Subtotal</span>
                  <span>¥{getTotal().toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-text-primary">
                  <span>Tax (10%)</span>
                  <span>¥{Math.floor(getTotal() * 0.1).toLocaleString()}</span>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-lg font-bold text-text-primary">
                    <span>Total</span>
                    <span>
                      ¥{Math.floor(getTotal() * 1.1).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 注文フォーム：未ログイン時はメールアドレス入力、ログイン時はチェックアウトボタンのみ */}
                {status === 'loading' ? (
                  <div className="w-full text-center py-4">
                    <Loader2
                      className="w-6 h-6 animate-spin mx-auto"
                      aria-hidden="true"
                    />
                  </div>
                ) : status === 'unauthenticated' ? (
                  // ゲスト購入フォーム（ポートフォリオサイトのため無効化）
                  <div className="relative group">
                    <div className="opacity-50">
                      <div className="mb-4">
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-300 mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={true}
                          required
                          maxLength={EMAIL_VALIDATION.MAX_LENGTH}
                          pattern={EMAIL_VALIDATION.REGEX.source}
                          className="w-full p-3 bg-background-primary border border-gray-600 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="We'll send you a confirmation email"
                          autoComplete="email"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={true}
                        className="w-full mt-6 bg-accent-dark hover:bg-accent-light px-8 py-4 rounded-lg transition-all transform hover:scale-105 font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                      </button>
                    </div>
                    
                    {/* ツールチップ */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-3 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                      ポートフォリオサイトのためログインが必要です
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                  
                  /* 元の実装（実装コード確認用）
                  <form onSubmit={handleGuestCheckout}>
                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        required
                        maxLength={EMAIL_VALIDATION.MAX_LENGTH}
                        pattern={EMAIL_VALIDATION.REGEX.source}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-background-primary border border-gray-600 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="We'll send you a confirmation email"
                        autoComplete="email"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full mt-6 bg-accent-dark hover:bg-accent-light px-8 py-4 rounded-lg transition-all transform hover:scale-105 font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                    </button>
                  </form>
                  */
                ) : (
                  // チェックアウトボタン
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full mt-6 bg-accent-dark hover:bg-accent-light px-8 py-4 rounded-lg transition-all transform hover:scale-105 font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
