/**
 * パスワードリセット確認API
 * - 入力値の検証
 * - トークンの検証
 * - パスワードの更新
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { verifyToken, deleteToken } from '@/lib/token';
import { validatePassword } from '@/utils/validation';

type ConfirmPasswordResetRequest = {
  token: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const { token, password } =
      (await request.json()) as ConfirmPasswordResetRequest;

    // ①入力値のバリデーション
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // ②トークンの検証
    const tokenRecord = await verifyToken(token, 'RESET');

    if (!tokenRecord.userId) {
      console.error('Token found but missing userId');
      return NextResponse.json(
        { error: 'トークンが無効もしくは期限切れです' },
        { status: 400 }
      );
    }

    // ③トランザクション処理
    await prisma.$transaction(async (tx) => {
      // 1. パスワードの更新
      await tx.user.update({
        where: { id: tokenRecord.userId as string },
        data: {
          hashedPassword: await hash(password, 12),
        },
      });

      // 2. 使用済みトークンの削除
      await deleteToken(token, 'RESET');
    });

    return NextResponse.json(
      {
        message: 'パスワードを更新しました',
        redirectTo: '/login',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset confirmation error:', error);
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
      { error: 'パスワードの更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
