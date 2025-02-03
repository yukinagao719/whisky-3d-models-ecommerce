/**
 * 商品ダウンロードAPI
 * - セッション認証またはダウンロードトークンの検証
 * - 商品データの取得とアクセス権限の確認
 * - S3署名付きURLの生成
 * - 商品情報の返却
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';
import { getSignedDownloadUrl } from '@/lib/aws';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/token';
import { Session } from 'next-auth';

export const dynamic = 'force-dynamic';

type DownloadableOrderItem = Prisma.OrderItemGetPayload<{
  include: {
    order: {
      select: {
        id: true;
        userId: true;
        orderEmail: true;
      };
    };
    product: {
      select: {
        nameEn: true;
        imageUrl: true;
      };
    };
  };
}>;

// 商品へのアクセス権限を検証
async function validateAccess(
  item: DownloadableOrderItem,
  session: Session | null,
  token: string | null
): Promise<boolean> {
  if (session?.user) {
    return item.order.userId === session.user.id;
  }

  if (token) {
    try {
      const tokenRecord = await verifyToken(token, 'DOWNLOAD');
      return tokenRecord.orderId === item.order.id;
    } catch {
      return false;
    }
  }

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ①認証情報の取得
    const session = await auth();

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!session?.user.id && !token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ②注文商品データの取得
    const item = await prisma.orderItem.findUnique({
      where: { id: params.id },
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            orderEmail: true,
          },
        },
        product: {
          select: {
            nameEn: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!item?.product?.nameEn) {
      console.error('Product not found');
      return NextResponse.json(
        { error: '商品が見つかりませんでした' },
        { status: 404 }
      );
    }

    // ③アクセス権限の検証
    const hasAccess = await validateAccess(item, session, token);

    if (!hasAccess) {
      console.error('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 401 }
      );
    }

    try {
      // ④署名付きURLの生成と商品情報の返却
      const signedUrl = await getSignedDownloadUrl(
        `${item.product.nameEn}.zip`
      );
      return NextResponse.json({
        url: signedUrl,
        product: {
          nameEn: item.product.nameEn,
          imageUrl: item.product.imageUrl,
        },
      });
    } catch (error) {
      console.error('Download URL generation failed', error);
      return NextResponse.json(
        { error: 'ダウンロードの準備に失敗しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Download process failed', error);
    return NextResponse.json(
      { error: 'ダウンロードに失敗しました' },
      { status: 500 }
    );
  }
}
