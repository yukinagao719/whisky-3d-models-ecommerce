import { NextResponse } from 'next/server';
import { TokenType } from '@prisma/client';
import { auth } from '@/auth';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { DEMO_USER_IDS, DemoUserId } from '@/lib/demo';
import { headers } from 'next/headers';

// ダウンロードトークン生成関数
const createDownloadToken = (
  orderId: string,
  orderDate: Date,
  userId: string,
  userEmail: string
) => ({
  type: TokenType.DOWNLOAD,
  token: crypto.randomBytes(32).toString('hex'),
  expires: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000),
  identifier: userEmail,
  userId,
  orderId,
});

// デモユーザー情報を取得する関数
const getDemoUsers = () => {
  const headersList = headers();
  const host = headersList.get('host');
  const isDevelopment =
    host?.includes('localhost') || host?.includes('127.0.0.1');

  return {
    WITH_HISTORY: {
      id: DEMO_USER_IDS.WITH_HISTORY,
      email: isDevelopment ? 'demo@example.com' : 'demo@3dwhisky.com',
      name: 'デモユーザー（購入履歴あり）',
      image: null,
      password: isDevelopment ? '@Demo123' : '@Demo-3dwhisky-user',
    },
    NEW_USER: {
      id: DEMO_USER_IDS.NEW_USER,
      email: isDevelopment ? 'new-demo@example.com' : 'new-demo@3dwhisky.com',
      name: 'デモユーザー（新規）',
      image: null,
      password: isDevelopment ? '@Demo123' : '@Demo-3dwhisky-newuser',
    },
  } as const;
};

// デモデータのリセット
async function resetDemoData(userId: string) {
  try {
    // デモユーザーのIDを取得
    const demoUser = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!demoUser || !demoUser.email) {
      throw new Error('Demo user not found or email is missing');
    }

    const DEMO_USERS = getDemoUsers();

    // IDによってデモユーザータイプを判定
    const originalDemoUser = Object.values(DEMO_USERS).find(
      (user) => user.id === (userId as DemoUserId)
    );

    if (!originalDemoUser) {
      throw new Error('Invalid demo user ID');
    }

    // パスワードハッシュを生成
    const hashedPassword = await hash(originalDemoUser.password, 12);

    // このユーザーの注文を削除
    await prisma.$transaction(async (tx) => {
      const demoOrders = await tx.order.findMany({
        where: { userId: demoUser.id },
        select: { id: true },
      });

      const orderIds = demoOrders.map((order) => order.id);

      // 関連データの削除
      await tx.token.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await tx.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      });

      // ユーザー情報を元のデモユーザー状態に復元
      await tx.user.update({
        where: { id: userId },
        data: {
          name: originalDemoUser.name,
          email: originalDemoUser.email,
          image: originalDemoUser.image,
          isDeleted: false,
          deletedAt: null,
          hashedPassword,
          updatedAt: new Date(),
        },
      });
    });

    // 購入履歴ありのユーザーの場合のみ、デモデータを作成
    if (userId === DEMO_USERS.WITH_HISTORY.id) {
      const products = await prisma.product.findMany({ take: 2 });
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // デモ注文の再作成
      await Promise.all([
        prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              userId: demoUser.id,
              orderEmail: originalDemoUser.email,
              orderNumber: 'DEMO-001',
              totalAmount: products[0].price,
              isPaid: true,
              paidAt: oneWeekAgo,
              status: 'COMPLETED',
              items: {
                create: {
                  productId: products[0].id,
                  name: products[0].name,
                  nameEn: products[0].nameEn,
                  price: products[0].price,
                },
              },
            },
          });

          await tx.token.create({
            data: createDownloadToken(
              order.id,
              oneWeekAgo,
              demoUser.id,
              originalDemoUser.email
            ),
          });
        }),

        prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              userId: demoUser.id,
              orderEmail: originalDemoUser.email,
              orderNumber: 'DEMO-002',
              totalAmount: products[1].price,
              isPaid: true,
              paidAt: now,
              status: 'COMPLETED',
              items: {
                create: {
                  productId: products[1].id,
                  name: products[1].name,
                  nameEn: products[1].nameEn,
                  price: products[1].price,
                },
              },
            },
          });

          await tx.token.create({
            data: createDownloadToken(
              order.id,
              now,
              demoUser.id,
              originalDemoUser.email
            ),
          });
        }),
      ]);
    }

    return true;
  } catch (error) {
    console.error('Failed to reset demo data:', error);
    throw error;
  }
}

export async function POST() {
  try {
    const session = await auth();
    const DEMO_USERS = getDemoUsers();

    // 削除済みのデモユーザーのメールアドレスパターンをチェック
    const isDeletedDemoUser =
      session?.user.email?.startsWith('deleted-') &&
      session?.user.email?.endsWith('@example.com');

    // デモユーザーのIDリスト
    const demoUserIds = Object.values(DEMO_USERS).map((user) => user.id);

    if (
      !session?.user?.id ||
      (!demoUserIds.includes(session.user.id as DemoUserId) &&
        !isDeletedDemoUser)
    ) {
      return NextResponse.json({ error: 'Not a demo user' }, { status: 403 });
    }

    await resetDemoData(session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Demo reset error:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
