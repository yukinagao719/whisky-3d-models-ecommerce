'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function AuthCallback() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const initializeAndRedirect = async () => {
      // 認証済みかつユーザーIDが存在する場合の処理
      // - Zustandストアの状態を取得
      if (status === 'authenticated' && session.user.id) {
        // useEffect内での非同期処理とコンポーネントのライフサイクルを考慮して、getState()を直接使用
        const authRedirect = useCartStore.getState().authRedirect;

        // チェックアウト初期化からのリダイレクトの場合
        if (authRedirect === 'checkout-init') {
          try {
            // 購入済み商品をカートから削除
            const removedItems = await useCartStore
              .getState()
              .removePurchasedItems();

            // 削除された商品がある場合、ユーザーにトースト通知
            if (removedItems && removedItems.length > 0) {
              const itemNames = removedItems
                .map((item) => item.name)
                .join(', ');
              toast.warning('購入済み商品をカートから削除しました', {
                description: `${itemNames}は既に購入済みです。`,
                duration: 5000,
                id: `removed-items-${session.user.id}`,
              });
            }

            // リダイレクト状態をリセットしてカートページへ移動
            useCartStore.getState().setAuthRedirect(null);
            router.replace('/cart');
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : 'エラーが発生しました',
              { duration: 5000 }
            );
            router.replace('/cart');
          }
        } else {
          // 通常の認証後はホームページへリダイレクト
          router.replace('/');
        }
      } else if (status === 'unauthenticated') {
        // 未認証の場合はホームページへリダイレクト
        router.replace('/');
      }
    };

    initializeAndRedirect();
  }, [status, session, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2
        className="w-8 h-8 animate-spin text-accent-dark"
        aria-hidden="true"
      />
    </div>
  );
}
