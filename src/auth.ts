/**
 * 認証プロバイダー：
 * - OAuth: Google, GitHub
 * - メール/パスワード認証
 *
 * * レート制限：（クレデンシャル認証）
 * - 期間: 15分
 * - 最大試行回数: 5回
 *
 *  * セッション設定：
 * - JWT戦略を使用
 * - セッション有効期限: 12時間
 * - セッション更新間隔: 1時間
 *
 *  * セキュリティ：
 * - メール認証必須
 * - パスワードハッシュ化（bcrypt）
 * - プロバイダー重複チェック
 * - アカウント削除状態の検証
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import type { Session, User } from 'next-auth';
import type { Account } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './lib/prisma';
import { compare } from 'bcryptjs';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// 環境変数でレート制限の有効/無効を制御
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';

// 認証レート制限の設定（クレデンシャル認証）
const AUTH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
} as const;

// Redis初期化（レート制限が有効な場合のみ）
let redis: any = null;
let ratelimit: any = null;

const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';

if (RATE_LIMIT_ENABLED) {
  try {
    redis = Redis.fromEnv();
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        AUTH_RATE_LIMIT.maxAttempts,
        `${AUTH_RATE_LIMIT.windowMs}ms`
      ),
    });
  } catch (error) {
    console.warn('Redis initialization failed, disabling rate limiting:', error);
    redis = null;
    ratelimit = null;
  }
}

// 認証プロバイダーの設定
const providers = {
  // Google OAuth設定
  google: Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
      },
    },
  }),

  // GitHub OAuth設定
  github: GitHub({
    clientId: process.env.GITHUB_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
  }),

  // メール/パスワード認証設定
  credentials: Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email', required: true },
      password: { label: 'Password', type: 'password', required: true },
    },
    async authorize(credentials, request) {
      try {
        const email = credentials?.email;
        const password = credentials?.password;

        // ①入力値のチェック
        if (
          !email ||
          !password ||
          typeof email !== 'string' ||
          typeof password !== 'string'
        ) {
          return null;
        }

        // ②ユーザー有無のチェック
        const user = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (!user) {
          return null;
        }

        // ③アカウントステータスのチェック
        if (!user.emailVerified) {
          return null;
        }
        if (user.isDeleted) {
          return null;
        }

        // ④レート制限のチェック（１５分間に５回まで）
        if (RATE_LIMIT_ENABLED && ratelimit) {
          const forwardedFor = request?.headers?.get?.('x-forwarded-for');
          const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
          const { success } = await ratelimit.limit(
            `${process.env.NODE_ENV}_auth:${ip}`
          );

          if (!success) {
            console.error(`Auth rate limit exceeded for IP: ${ip}`);
            return null;
          }
        }

        // ⑤パスワードのチェック
        if (!user.hashedPassword) {
          return null;
        }

        const isValid = await compare(password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        // 認証成功：ユーザー情報を返却
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      } catch (error) {
        console.error('Authorization error:', error);
        return null;
      }
    },
  }),
};

// 認証コールバックの設定
const callbacks = {
  async signIn({ user, account }: { user: User; account: Account | null }) {
    try {
      const email = user?.email;
      // ①メールアドレス有無のチェック
      if (!email) {
        return false;
      }

      // ②OAuthプロバイダーの重複チェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true },
      });

      if (existingUser) {
        if (account?.provider === 'credentials') {
          return true;
        }

        const firstAccount = existingUser.accounts[0];
        if (firstAccount && firstAccount.provider !== account?.provider) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Sign in callback error:', error);
      return false;
    }
  },

  async session({ session, token }: { session: Session; token: JWT }) {
    try {
      if (session.user && token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isDeleted: true,
          },
        });

        if (user) {
          session.user = { ...session.user, ...user };
        } else {
          console.error('Session callback: User not found');
        }
      }
      return session;
    } catch (error) {
      console.error('Session callback error:', error);
      return session;
    }
  },
};

// NextAuth設定のエクスポート
export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: Object.values(providers),
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60,
    updateAge: 1 * 60 * 60,
  },
  callbacks,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig);
