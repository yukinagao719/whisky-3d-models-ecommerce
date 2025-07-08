/**
 * サインアップAPI
 * - 入力値の検証
 * - ユーザー作成と既存注文の紐付け
 * - メール認証トークンの生成と送信
 */

import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/token';
import { sendVerificationEmail } from '@/lib/email';
import {
  validateName,
  validateEmail,
  validatePassword,
} from '@/utils/validation';

type SignupRequest = {
  name: string;
  email: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const { name, email, password } = (await request.json()) as SignupRequest;

    // ①入力値の正規化
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    // ②入力値のバリデーション
    const nameValidation = validateName(normalizedName);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(normalizedEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // ③ユーザーの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // ④トランザクション処理
    await prisma.$transaction(async (tx) => {
      // 1. ユーザーを作成
      const user = await tx.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          hashedPassword: await hash(password, 12),
          emailVerified: null,
        },
      });

      // 2. 既存の注文の紐付け
      await tx.order.updateMany({
        where: {
          orderEmail: normalizedEmail,
          userId: null,
        },
        data: { userId: user.id },
      });

      // 3. ダウンロードトークンの紐付け
      await tx.token.updateMany({
        where: {
          type: 'DOWNLOAD',
          identifier: normalizedEmail,
          userId: null,
        },
        data: { userId: user.id },
      });

      // 4. 認証用トークンを生成
      const verificationToken = await generateToken(
        'VERIFICATION',
        {
          userId: user.id,
          identifier: normalizedEmail,
        },
        tx
      );

      // 5. メール送信（失敗時は全体をロールバック）
      const emailResult = await sendVerificationEmail(
        normalizedEmail,
        verificationToken.token,
        process.env.APP_URL || ''
      );

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        throw new Error('確認メールの送信に失敗しました');
      }
    });

    return NextResponse.json(
      {
        message: '確認メールを送信しました。\nメールボックスをご確認ください。',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'アカウントの作成に失敗しました',
      },
      { status: 500 }
    );
  }
}
