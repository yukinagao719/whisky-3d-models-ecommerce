import { TokenType } from '@prisma/client';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import productsData from './data/products.json';
import { DEMO_USER_IDS } from '@/lib/demo';

// 商品データの型定義
type ProductSeedData = {
  name: string;
  nameEn: string;
  price: number;
  description: string;
  displayOrder: number;
  videoUrl: string | null;
  imageUrl: string;
  modelUrl: string | null;
};

// デモアカウントの設定
// 本番環境では環境変数から取得し、開発環境ではデフォルト値を使用
const demoAccounts = [
  {
    id: DEMO_USER_IDS.WITH_HISTORY,
    email: process.env.DEMO_USER_EMAIL || 'demo@example.com',
    password: process.env.DEMO_USER_PASSWORD || '@Demo123',
    name: 'デモユーザー（購入履歴あり）',
  },
  {
    id: DEMO_USER_IDS.NEW_USER,
    email: process.env.DEMO_NEW_USER_EMAIL || 'new-demo@example.com',
    password: process.env.DEMO_NEW_USER_PASSWORD || '@Demo123',
    name: 'デモユーザー（新規）',
  },
];

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

async function main() {
  try {
    // 外部キー制約を考慮して、順番にデータを削除
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.account.deleteMany();
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();

    // 商品データの作成
    const createdProducts = await Promise.all(
      productsData.products.map((product: ProductSeedData) =>
        prisma.product.create({ data: product })
      )
    );

    // デモアカウントの作成
    const [demoUser] = await Promise.all(
      demoAccounts.map(async (account) => {
        const hashedPassword = await hash(account.password, 12);
        return prisma.user.create({
          data: {
            id: account.id,
            email: account.email,
            name: account.name,
            hashedPassword,
            emailVerified: new Date(),
          },
        });
      })
    );

    // 注文日時の定義
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // トランザクションで注文とトークンを同時に作成
    await Promise.all([
      // 1週間前の注文（トークン期限切れ）
      prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: demoUser.id,
            orderEmail: demoUser.email!,
            orderNumber: 'DEMO-001',
            totalAmount: createdProducts[0].price,
            isPaid: true,
            paidAt: oneWeekAgo,
            status: 'COMPLETED',
            items: {
              create: {
                productId: createdProducts[0].id,
                name: createdProducts[0].name,
                nameEn: createdProducts[0].nameEn,
                price: createdProducts[0].price,
              },
            },
          },
        });

        const token = await tx.token.create({
          data: createDownloadToken(
            order.id,
            oneWeekAgo,
            demoUser.id,
            demoUser.email as string
          ),
        });

        return { order, token };
      }),

      // 最新の注文
      prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: demoUser.id,
            orderEmail: demoUser.email!,
            orderNumber: 'DEMO-002',
            totalAmount: createdProducts[1].price,
            isPaid: true,
            paidAt: now,
            status: 'COMPLETED',
            items: {
              create: {
                productId: createdProducts[1].id,
                name: createdProducts[1].name,
                nameEn: createdProducts[1].nameEn,
                price: createdProducts[1].price,
              },
            },
          },
        });

        const token = await tx.token.create({
          data: createDownloadToken(
            order.id,
            now,
            demoUser.id,
            demoUser.email as string
          ),
        });

        return { order, token };
      }),
    ]);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
