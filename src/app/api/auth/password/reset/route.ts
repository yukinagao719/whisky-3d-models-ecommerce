/**
 * パスワードリセットAPI
 * - 入力値の検証
 * - リセットトークンの生成
 * - パスワードリセットメールの送信
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/token';
import { sendPasswordResetEmail } from '@/lib/email';
import { validateEmail } from '@/utils/validation';

type ResetPasswordRequest = {
  email: string;
};

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as ResetPasswordRequest;

    // ①入力値の正規化
    const normalizedEmail = email.trim().toLowerCase();

    // ②入力値のバリデーション
    const emailValidation = validateEmail(normalizedEmail);
    if (!emailValidation.isValid) {
      console.error(`Invalid email format: ${normalizedEmail}`);
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // ③ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      // セキュリティのため、ユーザーが存在しない場合も同じメッセージを返す
      return NextResponse.json(
        {
          message: 'パスワードリセットの手順をメールでお送りしました',
        },
        { status: 200 }
      );
    }

    // ④トランザクション処理
    await prisma.$transaction(async (tx) => {
      // 1. 古いリセットトークンを削除
      await tx.token.deleteMany({
        where: {
          type: 'RESET',
          userId: user.id,
        },
      });

      // 2. 新しいリセットトークンを生成
      const resetToken = await generateToken(
        'RESET',
        {
          userId: user.id,
          identifier: normalizedEmail,
        },
        tx
      );

      // 3. パスワードリセットメールを送信
      const emailResult = await sendPasswordResetEmail(
        normalizedEmail,
        resetToken.token,
        process.env.APP_URL || ''
      );

      if (!emailResult.success) {
        console.error('Failed to send reset email:', emailResult.error);
        throw new Error('パスワードリセットメールの送信に失敗しました');
      }
    });

    return NextResponse.json(
      { message: 'パスワードリセットの手順をメールでお送りしました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'パスワードリセットの処理中にエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
