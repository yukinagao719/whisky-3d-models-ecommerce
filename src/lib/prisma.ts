import { PrismaClient } from '@prisma/client';

// グローバルオブジェクトにPrismaClientを保持するための型定義
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 開発環境でのホットリロード時の複数インスタンス生成を防止
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

// 開発環境のみグローバルにPrismaClientを保持
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
