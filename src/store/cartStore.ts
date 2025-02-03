/**
 * カートの状態管理ストア
 * - 商品の追加・削除・クリア機能
 * - 合計金額の計算
 * - 購入済み商品の自動除外
 * - 認証リダイレクトURLの管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types/shop';

type CartStore = {
  items: CartItem[];
  authRedirect: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  setAuthRedirect: (redirect: string | null) => void;
  removePurchasedItems: () => Promise<CartItem[]>;
};

export const useCartStore = create<CartStore>()(
  persist(
    // 初期状態
    (set, get) => ({
      items: [],
      authRedirect: null,

      // 認証リダイレクトURLの設定
      setAuthRedirect: (redirect) => {
        set({ authRedirect: redirect });
      },

      // 商品の追加
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (cartItem) => cartItem.id === item.id
          );
          if (existingItem) {
            return { items: [...state.items] };
          }

          return { items: [...state.items, { ...item }] };
        });
      },

      // 商品の削除
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      // カートのクリア
      clearCart: () => set({ items: [] }),

      // 合計金額の計算
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price, 0);
      },

      // 購入済み商品の削除
      removePurchasedItems: async () => {
        const currentItems = get().items;
        if (currentItems.length === 0) return [];

        try {
          // 購入済み商品のチェック
          const response = await fetch('/api/purchases/check-multiple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: currentItems.map((item) => item.id),
            }),
          });

          if (!response.ok) {
            const errorMessage =
              response.status === 400
                ? '商品IDが正しく指定されていません'
                : '購入履歴の確認中にエラーが発生しました';

            throw new Error(errorMessage);
          }

          // 購入済み商品の除外
          const { purchasedProductIds } = await response.json();
          const removedItems = currentItems.filter((item) =>
            purchasedProductIds.includes(item.id)
          );

          if (removedItems.length > 0) {
            set({
              items: currentItems.filter(
                (item) => !purchasedProductIds.includes(item.id)
              ),
            });
          }

          return removedItems;
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'cart-storage',
      // 永続化する状態の選択
      partialize: (state) => ({
        items: state.items,
        authRedirect: state.authRedirect,
      }),
    }
  )
);
