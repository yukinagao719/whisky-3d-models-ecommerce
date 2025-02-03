/**
 * プロフィール更新API
 * - セッション認証
 * - 入力値の検証
 * - プロフィール情報の更新
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { validateName } from '@/utils/validation';

type UpdateProfileRequest = {
  name: string;
};

export async function POST(request: Request) {
  try {
    // ①セッション認証の確認
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ②名前のバリデーション
    const { name } = (await request.json()) as UpdateProfileRequest;

    const validation = validateName(name);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // ③プロフィール情報の更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    return NextResponse.json(
      { message: 'プロフィールを更新しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    );
  }
}
