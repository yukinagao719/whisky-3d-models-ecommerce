/**
 * メール確認API
 * - トークンの検証
 * - メールアドレスの確認処理
 * - 注文情報の紐付け
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, deleteToken } from '@/lib/token';

type VerifyEmailRequest = {
  token: string;
};

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as VerifyEmailRequest;

    // ①トークンの検証
    const tokenRecord = await verifyToken(token, 'VERIFICATION');

    if (!tokenRecord.identifier) {
      console.error('Token found but missing identifier');
      return NextResponse.json(
        { error: 'トークンが無効もしくは期限切れです' },
        { status: 400 }
      );
    }

    // ②トランザクション処理
    await prisma.$transaction(async (tx) => {
      // 1. ユーザーの更新
      const user = await tx.user.update({
        where: { email: tokenRecord.identifier as string },
        data: { emailVerified: new Date() },
      });

      // 2. オーダーの更新
      await tx.order.updateMany({
        where: {
          orderEmail: tokenRecord.identifier as string,
          userId: null,
        },
        data: {
          userId: user.id,
        },
      });

      // 3. 使用済みトークンの削除
      await deleteToken(token, 'VERIFICATION');
    });

    return NextResponse.json(
      {
        message: 'Email verification completed',
        redirectTo: '/login?verified=true',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);

    if (
      error instanceof Error &&
      error.message === 'Invalid or expired token'
    ) {
      return NextResponse.json(
        { error: 'トークンが無効もしくは期限切れです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '確認処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
