/**
 * アカウント削除API
 * - ユーザー認証の確認
 * - ユーザー情報の匿名化
 * - 関連データの処理（アカウント、トークン、注文情報）
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

type DeletedUserData = {
  name: string;
  email: string;
  hashedPassword: null;
  image: null;
  isDeleted: true;
  deletedAt: Date;
};

export async function DELETE() {
  try {
    // ①認証情報の取得
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ②既存ユーザーの確認
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // ③トランザクション処理
    await prisma.$transaction(async (tx) => {
      // 1. OAuth関連のアカウントを削除
      if (currentUser.accounts.length > 0) {
        await tx.account.deleteMany({
          where: { userId: currentUser.id },
        });
      }

      // 2. すべてのトークン（VERIFICATION, RESET, DOWNLOAD）を削除
      await tx.token.deleteMany({
        where: { userId: currentUser.id },
      });

      // 3. 削除済みユーザー用の匿名メールアドレスを生成
      const anonymousEmail = `deleted-${crypto.randomUUID()}@example.com`;

      // 4. 関連する注文のメールアドレスを匿名
      await tx.order.updateMany({
        where: { userId: currentUser.id },
        data: {
          orderEmail: anonymousEmail,
        },
      });

      // 5. ユーザー情報を匿名化
      const deletedUserData: DeletedUserData = {
        name: 'Deleted User',
        email: anonymousEmail,
        hashedPassword: null,
        image: null,
        isDeleted: true,
        deletedAt: new Date(),
      };

      await tx.user.update({
        where: { id: currentUser.id },
        data: deletedUserData,
      });
    });

    return NextResponse.json(
      { message: 'アカウントを削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'アカウントの削除に失敗しました' },
      { status: 500 }
    );
  }
}
