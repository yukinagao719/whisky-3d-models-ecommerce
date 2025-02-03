'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ModelViewer from '@/components/model-viewer/ModelViewer';
import { useCartStore } from '@/store/cartStore';
import { capitalize } from '@/utils/string';
import { Product } from '@/types/shop';

type ProductDetailProps = {
  product: Product;
};

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { data: session } = useSession();
  const [isPurchased, setIsPurchased] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 商品の購入状態を確認
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!session?.user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);
        const response = await fetch('/api/purchases/check-multiple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productIds: [product.id],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsPurchased(data.purchasedProductIds.includes(product.id));
        }
      } catch {
        // エラー時は単に未購入として扱う
      } finally {
        setIsChecking(false);
      }
    };

    checkPurchaseStatus();
  }, [product.id, session?.user?.id]);

  // カートに商品を追加し、カートページへ遷移
  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      nameEn: product.nameEn,
      price: product.price,
      imageUrl: product.imageUrl,
    };
    addItem(cartItem);
    router.push('/cart');
  };

  return (
    <main className="container mx-auto px-4 flex flex-col lg:flex-row lg:items-start items-start gap-6 lg:gap-20 py-8 lg:py-12 lg:mt-10 mb-5">
      {/* 3Dモデルビューワーセクション */}
      <section
        aria-label="商品3Dモデル"
        className="w-full lg:w-2/5 lg:sticky lg:top-16 lg:mt-0 -mt-8"
      >
        <ModelViewer modelUrl={product.modelUrl} imageUrl={product.imageUrl} />
      </section>

      {/* 商品詳細情報セクション */}
      <section
        aria-label="商品詳細情報"
        className="w-full lg:w-3/5 bg-background-secondary text-text-primary rounded-lg p-4 lg:p-8"
      >
        {/* 商品情報 */}
        <h1 className="text-2xl lg:text-3xl mb-2 text-center">
          {product.name}
        </h1>
        <h2 className="text-base lg:text-lg mb-4 text-center">
          {capitalize(product.nameEn)}
        </h2>
        <p className="text-text-secondary text-sm lg:text-base tracking-widest leading-7 mb-5">
          {product.description}
        </p>

        {/* ファイル形式 */}
        <div className="text-xs lg:text-sm">
          <h3 className="text-text-secondary font-semibold mb-5 border-b border-gray-700 pb-2">
            ファイル形式
          </h3>
          <div className="text-xs lg:text-sm">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 lg:gap-16">
              {/* GLBフォーマット情報 */}
              <div
                role="presentation"
                className="relative group w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-accent-dark rounded-lg blur opacity-25 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative px-4 lg:px-6 py-2 border border-accent-dark rounded-lg bg-background-primary w-full sm:w-auto">
                  <h4 className="text-center font-bold text-accent-light">
                    GLB
                  </h4>
                  <p className="mt-1 text-text-secondary text-center">
                    Web表示に利用
                    <br />
                    （Three.jsなど）
                  </p>
                </div>
              </div>

              {/* FBXフォーマット情報 */}
              <div
                role="presentation "
                className="relative group w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-accent-dark rounded-lg blur opacity-25 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative px-4 lg:px-8 py-2 border border-accent-dark rounded-lg bg-background-primary w-full sm:w-auto">
                  <h4 className="text-center font-bold text-accent-light">
                    FBX
                  </h4>
                  <p className="mt-1 text-text-secondary text-center">
                    ゲームエンジンに利用
                    <br />
                    （Unity, UEなど）
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 同梱ファイル一覧 */}
        <div className="text-xs lg:text-sm text-text-secondary mt-6">
          <h3 className="font-semibold mb-5 border-b border-gray-700 pb-2">
            同梱ファイル一覧
          </h3>
          <p>
            モデルデータ (GLB, FBX) / Blenderファイル (.blend) /
            テクスチャファイル / 各種ドキュメント (PDF)
          </p>
        </div>

        {/* 仕様とライセンス情報 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-text-secondary text-xs lg:text-sm font-semibold mb-5 border-b border-gray-700 pb-2">
              3Dモデル仕様
            </h3>
            <ul
              aria-label="3Dモデル仕様詳細"
              className="text-xs lg:text-sm space-y-2"
            >
              <li>- ポリゴン数：約15,000</li>
              <li>- テクスチャ：2K (2048×2048px)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-text-secondary text-xs lg:text-sm font-semibold mb-5 border-b border-gray-700 pb-2">
              ライセンス
            </h3>
            <ul
              aria-label="ライセンス詳細"
              className="text-xs lg:text-sm space-y-2"
            >
              <li>- 個人利用・商用利用可能</li>
              <li>- 再配布・再販売禁止</li>
              <li>- 著作権は3D/WHISKYに帰属</li>
            </ul>
          </div>
        </div>

        {/* 価格と購入ボタン */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-20 items-center mt-8">
          <div
            aria-label={`価格: ${product.price.toLocaleString()}円`}
            className="text-base lg:text-lg text-text-secondary"
          >
            ¥{product.price.toLocaleString()}
          </div>
          {isChecking ? (
            <button
              aria-label="購入状態を確認中"
              disabled
              className="w-full sm:w-auto bg-gray-600 px-8 py-3 rounded-lg"
            >
              確認中...
            </button>
          ) : isPurchased ? (
            <button
              aria-label="この商品は購入済みです"
              disabled
              className="w-full sm:w-auto bg-gray-600 px-8 py-3 rounded-lg"
            >
              購入済み
            </button>
          ) : (
            <button
              aria-label="カートに商品を追加"
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-accent-dark hover:bg-accent-light px-8 py-3 rounded-lg transition-colors"
            >
              カートに追加
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
