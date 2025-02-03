/**
 * 商品購入履歴確認API
 * - 購入済み商品の確認
 * - 商品ID配列に基づく検索
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

type CheckPurchaseRequest = {
  productIds: string[];
};

export async function POST(request: Request) {
  try {
    // ①リクエストデータの検証
    const { productIds } = (await request.json()) as CheckPurchaseRequest;

    if (!productIds?.length) {
      console.error('Missing or empty productIds');
      return NextResponse.json(
        { error: '商品IDが正しく指定されていません' },
        { status: 400 }
      );
    }
    // ②購入履歴の検索
    const session = await auth();
    const purchasedItems = await prisma.orderItem.findMany({
      where: {
        productId: { in: productIds },
        order: {
          userId: session?.user.id,
          isPaid: true,
        },
      },
      select: { productId: true },
    });

    const purchasedProductIds = purchasedItems.map((item) => item.productId);

    return NextResponse.json(
      {
        purchasedProductIds,
        message:
          purchasedProductIds.length > 0
            ? '購入済みの商品が見つかりました'
            : '購入済みの商品はありません',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Purchase history check error:', error);
    return NextResponse.json(
      { error: '購入履歴の確認中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
