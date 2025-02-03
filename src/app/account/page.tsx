/**
 * アカウントページ
 * - プロフィール情報の表示・編集
 * - アバター画像のアップロード
 * - 購入履歴の表示
 * - 購入済み商品のダウンロード
 * - アカウント削除
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Download, Loader2, Edit2 } from 'lucide-react';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/assetHelpers';
import { DEFAULT_PATHS } from '@/lib/constants';
import {
  NAME_VALIDATION,
  validateImage,
  validateName,
} from '@/utils/validation';
import { capitalize } from '@/utils/string';
import { DEMO_USER_IDS, DemoUserId } from '@/lib/demo';

// 通知の型定義
type NotificationType = 'success' | 'error';

type Notification = {
  type: NotificationType;
  message: string;
};

type PurchaseItem = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  product: {
    imageUrl: string;
  };
};

type PurchaseHistory = {
  orderNumber: string;
  totalAmount: number;
  paidAt: Date | null;
  items: PurchaseItem[];
};

type PurchaseResponse = {
  orderNumber: string;
  totalAmount: number;
  paidAt: string | null;
  items: PurchaseItem[];
};

// 通知メッセージを表示
// -成功時は緑系、エラー時は赤系の背景色で表示
const NotificationMessage = ({ type, message }: Notification) => {
  return (
    <div
      className={`px-4 py-3 rounded relative mb-4 ${
        type === 'success'
          ? 'bg-status-success-light border-status-success-border text-status-success-dark'
          : 'bg-status-error-light border-status-error-border text-status-error-dark'
      }`}
    >
      {message}
    </div>
  );
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

// APIエラーハンドリング用の関数
const handleApiError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return '予期せぬエラーが発生しました';
};

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [downloadingItems, setDownloadingItems] = useState<
    Record<string, boolean>
  >({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // セッションからユーザー名を初期設定
  useEffect(() => {
    if (session?.user.name) {
      setName(session.user.name);
    }
  }, [session]);

  // 成功通知を3秒後に自動クリア
  useEffect(() => {
    if (notification?.type === 'success') {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 購入履歴データの取得
  useEffect(() => {
    const fetchPurchases = async () => {
      if (!session?.user.id || purchases.length > 0) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/purchases');

        if (!response.ok) throw new Error('購入履歴の取得に失敗しました');

        const data = await response.json();

        // 日付文字列をDateオブジェクトに変換
        const processedData = data.map((purchase: PurchaseResponse) => ({
          ...purchase,
          paidAt: purchase.paidAt ? new Date(purchase.paidAt) : null,
        }));
        setPurchases(processedData);
      } catch (error) {
        setNotification({
          type: 'error',
          message: handleApiError(error),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, [session, purchases.length]);

  // プロフィール更新を処理
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 入力値のバリデーション
    const validation = validateName(name);
    if (!validation.isValid) {
      setNotification({
        type: 'error',
        message: validation.error || '入力内容を確認してください',
      });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      await update();
      setIsEditing(false);
      setNotification({
        type: 'success',
        message: 'プロフィールを更新しました',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: handleApiError(error),
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // アバター画像の変更を処理
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルのバリデーション
    const validation = validateImage(file);
    if (!validation.isValid) {
      setNotification({
        type: 'error',
        message: validation.error || '画像ファイルの形式を確認してください',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/account/update-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'アバターの更新に失敗しました');
      }

      await update();
      setNotification({
        type: 'success',
        message: 'アバター画像を更新しました',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: handleApiError(error),
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ファイルダウンロードを処理
  const handleDownload = async (itemId: string) => {
    setDownloadingItems((prev) => ({ ...prev, [itemId]: true }));
    try {
      const item = purchases
        .flatMap((purchase) => purchase.items)
        .find((item) => item.id === itemId);

      if (!item) {
        throw new Error('商品が見つかりません');
      }

      const response = await fetch(
        `/api/purchases/download/${encodeURIComponent(itemId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ダウンロードに失敗しました');
      }

      await downloadFile(data.url, `${data.product.nameEn}.zip`);

      setNotification({
        type: 'success',
        message: 'ダウンロードが完了しました',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: handleApiError(error),
      });
    } finally {
      setDownloadingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // アカウント削除を処理
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウントの削除に失敗しました');
      }

      // デモユーザーの場合、データをリセット
      // IDベースでデモユーザーをチェック
      if (
        session?.user?.id &&
        Object.values(DEMO_USER_IDS).includes(session.user.id as DemoUserId)
      ) {
        const resetResponse = await fetch('/api/demo', {
          method: 'POST',
        });

        if (!resetResponse.ok) {
          throw new Error('デモデータのリセットに失敗しました');
        }
      }

      await signOut({ redirect: false });
      localStorage.clear();
      window.location.href = '/';
    } catch (error) {
      setNotification({
        type: 'error',
        message: handleApiError(error),
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  // セッションが確立していない場合はローディング表示
  if (!session?.user) {
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
      <h1 className="text-3xl font-semibold text-text-primary mb-8">Account</h1>

      {/* 通知メッセージ */}
      {notification && (
        <NotificationMessage
          type={notification.type}
          message={notification.message}
          aria-live="polite"
        />
      )}

      {/* プロフィール編集セクション */}
      <section className="bg-background-secondary rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-end justify-between">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* アバター画像 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <Image
                  src={
                    session.user.image || getAssetUrl(DEFAULT_PATHS.icon) || ''
                  }
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                  priority
                  onError={(e) => {
                    const image = e.target as HTMLImageElement;
                    image.src = getAssetUrl(DEFAULT_PATHS.icon) || '';
                  }}
                />
              </div>

              {/* アバター画像アップロードボタン */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1 bg-gray-800 rounded-full cursor-pointer hover:bg-gray-700"
                aria-label="アバター画像変更"
              >
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
                <Edit2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
              </label>

              {/* アップロード中のローディング表示 */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Loader2
                    className="w-6 h-6 animate-spin text-accent-dark"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* プロフィール情報表示/編集フォーム */}
            {!isEditing ? (
              <div className="text-center sm:text-left">
                <h2 className="text-xl text-text-primary">
                  {name || 'Anonymous'}
                </h2>
                <p className="text-gray-400">{session.user.email}</p>
              </div>
            ) : (
              <form
                aria-label="プロフィール編集フォーム"
                onSubmit={handleProfileUpdate}
                className="flex-1 w-full"
              >
                <div className="space-y-4">
                  {/* 名前入力フィールド */}
                  <div>
                    <label htmlFor="name" className="sr-only">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={NAME_VALIDATION.MAX_LENGTH}
                      className="w-full px-3 py-2 bg-background-primary border border-gray-600 rounded-md text-text-primary"
                      placeholder="Name"
                    />

                    {/* 文字数カウンター */}
                    <p className="text-sm text-gray-400 mt-1">
                      {name.length}/{NAME_VALIDATION.MAX_LENGTH}文字
                    </p>
                  </div>

                  {/* メールアドレス表示（変更不可） */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-gray-400 mb-1"
                    >
                      Email
                    </label>
                    <p id="email" className="text-text-primary">
                      {session.user.email}
                    </p>
                  </div>

                  {/* フォーム操作ボタン */}
                  <div className="flex space-x-2">
                    {/* 保存ボタン */}
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-text-primary rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!name.trim() || isUpdatingProfile}
                    >
                      {isUpdatingProfile ? (
                        <div className="flex items-center gap-2">
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        'Save'
                      )}
                    </button>

                    {/* キャンセルボタン */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(session.user.name || '');
                      }}
                      className="px-4 py-2 bg-gray-600 text-text-primary rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* 編集モード切り替えボタン */}
          {!isEditing && (
            <button
              aria-label="プロフィール編集"
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-text-primary mt-4 sm:mt-0"
            >
              <Edit2 className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* 購入履歴セクション */}
      <section
        aria-labelledby="purchase-history-heading"
        className="bg-background-secondary rounded-lg p-6 mb-8"
      >
        <h2
          id="purchase-history-heading"
          className="text-2xl font-semibold text-text-primary mb-4"
        >
          Purchase History
        </h2>

        {/* 購入履歴のローディング/空状態/リスト表示 */}
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2
              className="w-8 h-8 animate-spin text-accent-dark"
              aria-hidden="true"
            />
          </div>
        ) : purchases.length === 0 ? (
          <p className="text-gray-400">No purchase history available</p>
        ) : (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <div
                key={purchase.orderNumber}
                className="border border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  {/* 注文概要情報 */}
                  <div>
                    <p className="text-sm text-gray-400">
                      Order #: {purchase.orderNumber}
                    </p>
                    <p className="text-sm text-gray-400">
                      Date:{' '}
                      {purchase.paidAt?.toLocaleDateString() ?? 'Not paid'}
                    </p>
                  </div>
                </div>

                {/* 購入商品リスト */}
                <div className="space-y-4">
                  {purchase.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row gap-6 p-6 bg-background-primary rounded"
                    >
                      {/* 商品画像 */}
                      <div className="w-full sm:w-32 aspect-square relative rounded-lg overflow-hidden bg-background-secondary">
                        <Image
                          src={
                            getAssetUrl(item.product?.imageUrl || null) ||
                            getAssetUrl(DEFAULT_PATHS.productImage) ||
                            ''
                          }
                          alt={item.nameEn}
                          fill
                          sizes="(max-width: 640px) 100vw, 128px"
                          className="object-cover"
                          priority
                        />
                      </div>

                      {/* 商品情報 */}
                      <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                          <p className="text-text-primary text-xl font-medium">
                            {item.name}
                          </p>
                          <p className="text-text-primary text-sm mb-2">
                            {capitalize(item.nameEn)}
                          </p>
                          <p className="text-sm text-gray-400">
                            ¥{item.price.toLocaleString()}
                          </p>
                        </div>

                        {/* ダウンロードボタン */}
                        <div className="min-w-[200px] flex justify-end mt-4 sm:mt-0">
                          <button
                            aria-label={`${item.name}をダウンロード`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-accent-dark hover:bg-accent-light transition-colors rounded text-text-primary text-sm disabled:opacity-50"
                            onClick={() => handleDownload(item.id)}
                            disabled={downloadingItems[item.id]}
                          >
                            {downloadingItems[item.id] ? (
                              <>
                                <Loader2
                                  className="w-4 h-4 mr-2 animate-spin"
                                  aria-hidden="true"
                                />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download
                                  className="w-4 h-4 mr-2"
                                  aria-hidden="true"
                                />
                                Download
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* アカウント削除セクション */}
      <section className="flex justify-end mb-8">
        <button
          aria-label="アカウント削除"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-red-600 text-text-primary rounded-md hover:bg-red-700 text-sm"
        >
          Delete Account
        </button>
      </section>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-background-secondary rounded-lg p-6 max-w-md w-full m-4">
            <h3
              id="delete-modal-title"
              className="text-xl font-semibold text-red-500 mb-4"
            >
              アカウントを削除しますか？
            </h3>
            <div className="text-gray-400 mb-4 text-sm space-y-2">
              <p>この操作は取り消すことができません。</p>
              <p>
                すべてのデータが完全に削除され、購入済みの商品もダウンロードできなくなります。
              </p>
            </div>

            {/* モーダル操作ボタン */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-600 text-text-primary rounded-md hover:bg-gray-700 order-2 sm:order-1"
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-text-primary rounded-md hover:bg-red-700 disabled:opacity-50 order-1 sm:order-2"
                disabled={isLoading}
              >
                {/* アカウント削除のローディング */}
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
