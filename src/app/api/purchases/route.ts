/**
 * 購入履歴取得API
 * - アカウントページでの購入履歴表示に使用
 * - 購入済み商品のダウンロードに使用
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // ①セッション認証の確認
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ②購入履歴の取得
    const purchases = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        isPaid: true,
      },
      select: {
        orderNumber: true,
        totalAmount: true,
        paidAt: true,
        items: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            price: true,
            product: {
              select: {
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json(
      { error: '購入履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}
