import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DownloadContent } from './download-content';

// 常に最新のデータを取得するために動的レンダリングを強制
export const dynamic = 'force-dynamic';

type DownloadPageProps = {
  params: {
    token: string;
  };
};

// ダウンロードトークンから有効な注文情報を取得
async function getOrderByToken(token: string) {
  const tokenRecord = await prisma.token.findFirst({
    where: {
      type: 'DOWNLOAD',
      token,
      expires: { gt: new Date() },
    },
    // 必要な関連データを一括取得（N+1問題を回避）
    include: {
      order: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  nameEn: true,
                  imageUrl: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  return tokenRecord?.order;
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  // トークンから注文情報を取得
  const order = await getOrderByToken(params.token);

  // 無効なトークンの場合は404ページを表示
  if (!order) {
    notFound();
  }

  // ユーザーアカウントの有無を確認
  const hasAccount = !!order.user;

  return (
    <main className="min-h-screen">
      <DownloadContent order={order} hasAccount={hasAccount} />
    </main>
  );
}
