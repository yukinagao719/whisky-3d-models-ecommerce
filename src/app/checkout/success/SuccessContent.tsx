'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';

export default function SuccessPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Stripe決済セッション情報の取得と購入完了処理
  useEffect(() => {
    if (status === 'loading' || !sessionId) return;

    async function fetchSessionDetails() {
      try {
        // 型安全のための追加チェック
        if (!sessionId) return;

        // 決済セッション情報の取得
        const response = await fetch(
          `/api/purchases/session?sessionId=${encodeURIComponent(sessionId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '購入情報の取得に失敗しました');
        }

        // 顧客メールアドレスの保存
        if (data.customerEmail) {
          setCustomerEmail(data.customerEmail);
          setPaymentVerified(true);
        }

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        toast.error(
          error instanceof Error
            ? error.message
            : '予期せぬエラーが発生しました',
          {
            duration: 5000,
          }
        );
      }
    }

    fetchSessionDetails();
  }, [sessionId, status]);

  // 購入完了時のカートクリア処理
  useEffect(() => {
    if (!paymentVerified || !sessionId) return;

    clearCart();
  }, [paymentVerified, sessionId, clearCart]);

  // ローディング中の表示
  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2
          className="w-8 h-8 animate-spin text-accent-dark"
          aria-hidden="true"
        />
      </div>
    );
  }

  // ログインユーザー向け購入完了画面
  if (session && paymentVerified) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div
          role="alert"
          aria-live="polite"
          className="flex flex-col items-center justify-center py-20 bg-background-secondary rounded-lg"
        >
          <h1 className="text-2xl font-bold text-text-primary mb-6">
            Purchase Complete!
          </h1>

          {/* 購入完了メッセージ */}
          <p className="text-text-primary mb-4">Thank you for your purchase.</p>
          <p className="text-text-primary mb-8">
            Your files are now available in your account.
          </p>

          {/* アカウントページへのリンク */}
          <div className="flex gap-4">
            <Link
              href="/account"
              className="px-6 py-3 bg-accent-dark hover:bg-accent-light transition-colors rounded-lg text-text-primary"
            >
              Go to Account Page
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 未ログインユーザー向け購入完了画面
  return (
    <main className="container mx-auto px-4 py-16">
      <div
        role="alert"
        aria-live="polite"
        className="flex flex-col items-center justify-center py-20 bg-background-secondary rounded-lg"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          Payment Successful!
        </h1>

        <div className="text-center">
          {/* 購入完了メッセージ */}
          <p className="text-text-primary mb-4">Thank you for your purchase!</p>

          {/* 重要な注意事項 */}
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-sm mb-8">
            <p className="text-yellow-200 font-medium mb-2">
              ご注意：ダウンロードリンクの有効期限は7日間
            </p>
            <ul className="text-gray-300 space-y-2 text-left text-sm">
              <li>
                アカウントを作成いただくと、以下の特典が永続的にご利用いただけます
              </li>
              <li>- ご購入商品への無期限アクセス</li>
              <li>- アップデートやサポートの継続的なご提供</li>
              <li>- いつでもどこでもファイルをダウンロード可能</li>
            </ul>
          </div>

          {/* アカウント作成リンク */}
          <Link
            href={`/signup?email=${encodeURIComponent(customerEmail)}`}
            className="px-6 py-3 bg-accent-dark hover:bg-accent-light transition-colors rounded-lg text-text-primary inline-block"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
