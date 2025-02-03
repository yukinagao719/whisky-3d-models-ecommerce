import { TokenType, PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// トランザクション用Prismaクライアントの型定義
type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

type TokenConfig = {
  expiresIn: number;
};

// トークンタイプ別の有効期限設定
const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  VERIFICATION: {
    expiresIn: 24 * 60 * 60 * 1000,
  },
  RESET: {
    expiresIn: 60 * 60 * 1000,
  },
  DOWNLOAD: {
    expiresIn: 7 * 24 * 60 * 60 * 1000,
  },
};

// トークンの生成と保存
export async function generateToken(
  type: TokenType,
  options: {
    identifier?: string;
    userId?: string;
    orderId?: string;
  },
  prismaInstance: PrismaClient | PrismaTransactionClient = prisma
) {
  const token = crypto.randomBytes(32).toString('hex');
  const config = TOKEN_CONFIGS[type];

  const tokenRecord = await prismaInstance.token.create({
    data: {
      type,
      token,
      expires: new Date(Date.now() + config.expiresIn),
      identifier: options.identifier,
      userId: options.userId,
      orderId: options.orderId,
    },
  });

  return tokenRecord;
}

// トークンの有効性検証と関連データの取得
export async function verifyToken(token: string, type: TokenType) {
  const tokenRecord = await prisma.token.findFirst({
    where: {
      token,
      type,
      expires: { gt: new Date() },
    },
    include: {
      user: true,
      order: true,
    },
  });

  if (!tokenRecord) {
    throw new Error('Invalid or expired token');
  }

  return tokenRecord;
}

// トークンの削除処理
export async function deleteToken(token: string, type: TokenType) {
  await prisma.token.delete({
    where: {
      token,
      type,
    },
  });
}
