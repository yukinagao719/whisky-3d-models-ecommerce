/**
 * メールアドレス存在チェックAPI
 * - 安全なユーザー管理のため、メールアドレスの一意性を保つ
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/utils/validation';

type EmailCheckRequest = {
  email: string;
};

export async function POST(request: Request) {
  try {
    // ①リクエストデータの検証
    const { email } = (await request.json()) as EmailCheckRequest;

    // ②メールアドレスのバリデーション
    const { isValid, error } = validateEmail(email);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({ exists: existingUser !== null });
  } catch (error) {
    console.error('Email check failed with error:', error);
    return NextResponse.json(
      {
        error: 'アカウント確認に失敗しました。時間をおいて再度お試しください。',
      },
      { status: 500 }
    );
  }
}
