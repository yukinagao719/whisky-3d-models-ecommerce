'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, Loader2 } from 'lucide-react';
import { capitalize } from '@/utils/string';
import { getAssetUrl } from '@/lib/assetHelpers';
import { DEFAULT_PATHS } from '@/lib/constants';

type OrderItem = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  product: {
    imageUrl: string;
  } | null;
};

type Order = {
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  orderEmail: string;
};

type DownloadContentProps = {
  order: Order;
  hasAccount: boolean;
};

// ファイルダウンロード用の関数
// -Blob URLを使用して安全にファイルをダウンロード
const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('ダウンロードに失敗しました');

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
};

export function DownloadContent({ order, hasAccount }: DownloadContentProps) {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // ファイルダウンロードの処理
  const handleDownload = async (itemId: string) => {
    setDownloading((prev) => ({ ...prev, [itemId]: true }));
    setError(null);

    try {
      // URLからダウンロードトークンを取得
      const urlParams = new URLSearchParams(window.location.search);
      const token =
        urlParams.get('token') ||
        new URL(window.location.href).pathname.split('/').pop();

      if (!token) {
        throw new Error('ダウンロードトークンが必要です');
      }

      // ダウンロードURLの取得
      const response = await fetch(
        `/api/purchases/download/${encodeURIComponent(itemId)}?token=${encodeURIComponent(token)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ダウンロードに失敗しました');
      }

      const data = await response.json();
      const item = order.items.find((item) => item.id === itemId);

      if (!item) {
        throw new Error('商品が見つかりません');
      }

      await downloadFile(data.url, `${item.nameEn}.zip`);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'ダウンロードに失敗しました。時間をおいて再度お試しください。'
        );
      }
    } finally {
      setDownloading((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="bg-background-secondary rounded-lg p-8 mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Thank you for your purchase!
          </h1>

          <p aria-label="注文番号" className="text-gray-300 mb-6">
            Order #: {order.orderNumber}
          </p>

          {/* 購入商品リスト */}
          <div role="list" className="space-y-4 mb-6">
            {order.items.map((item) => (
              <div
                role="listitem"
                key={item.id}
                className="flex items-center bg-background-primary p-4 rounded-lg"
              >
                {/* 商品情報 */}
                <div className="flex items-center flex-1">
                  <div className="w-32 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        getAssetUrl(item.product?.imageUrl || null) ||
                        getAssetUrl(DEFAULT_PATHS.icon) ||
                        ''
                      }
                      alt={item.nameEn}
                      fill
                      sizes="(max-width: 640px) 100vw, 128px"
                      className="object-cover"
                    />
                  </div>

                  <div className="ml-4 flex-1">
                    <h3 className="text-text-primary font-medium">
                      {item.name}
                    </h3>
                    <p className="text-sm text-text-primary ">
                      {capitalize(item.nameEn)}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      ¥{item.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* ダウンロードボタン */}
                <button
                  aria-label={`ダウンロード： ${item.name}`}
                  onClick={() => handleDownload(item.id)}
                  disabled={downloading[item.id]}
                  className="ml-4 inline-flex items-center px-4 py-2 bg-accent-dark hover:bg-accent-light transition-colors rounded text-text-primary disabled:opacity-50"
                >
                  {downloading[item.id] ? (
                    <>
                      <Loader2
                        className="w-4 h-4 mr-2 animate-spin"
                        aria-hidden="true"
                      />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                      Download
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* エラー表示 */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-status-error-light border border-status-error-border text-status-error-dark  p-4 rounded-lg mb-6"
            >
              {error}
            </div>
          )}

          {/* アカウント作成案内 */}
          {!hasAccount && (
            <div
              role="complementary"
              className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mt-6"
            >
              <h2 className="text-yellow-200 font-medium mb-2">
                より安全なダウンロード管理のために
              </h2>
              <p className="text-gray-300 text-sm">
                アカウントを作成いただくと、購入した商品に永続的にアクセスでき、
                アップデートやサポートも利用可能になります。
              </p>
              <a
                href={`/signup?email=${encodeURIComponent(order.orderEmail)}`}
                className="inline-block mt-3 text-accent-light hover:text-yellow-200"
              >
                Create an Account
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
