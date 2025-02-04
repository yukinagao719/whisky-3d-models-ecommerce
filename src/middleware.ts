/**
 * ミドルウェア設定
 * - 認証保護: /account へのアクセス制限
 * - レート制限:
 *   - サインアップ（24時間5回まで）
 *   - パスワードリセット（1時間3回まで）
 *   - メールチェック（15分5回まで）
 *   - チェックアウト（15分5回まで）
 *   - ダウンロード（24時間3回まで）
 *   - アバター更新（1時間5回まで）
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const env = process.env.NODE_ENV || 'development';

// 環境変数でレート制限の有効/無効を制御
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';

const RATE_LIMITS = {
  signup: {
    windowMs: 24 * 60 * 60 * 1000,
    maxAttempts: 6,
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    maxAttempts: 3,
  },
  emailCheck: {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
  },
  checkout: {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
  },
  download: {
    windowMs: 24 * 60 * 60 * 1000,
    maxAttempts: 3,
  },
  avatarUpdate: {
    windowMs: 60 * 60 * 1000,
    maxAttempts: 5,
  },
} as const;

type ProtectedRoute =
  | '/account'
  | '/api/auth/signup'
  | '/api/auth/password/reset'
  | '/api/auth/email/check'
  | '/api/checkout'
  | '/api/purchases/download/[id]'
  | '/api/account/update-avatar';

type ProtectionType =
  | 'authenticated'
  | 'rateLimitedSignup'
  | 'rateLimitedPasswordReset'
  | 'rateLimitedEmailCheck'
  | 'rateLimitedCheckout'
  | 'rateLimitedDownload'
  | 'rateLimitedAvatarUpdate';

const routeConfig: Record<ProtectedRoute, ProtectionType> = {
  '/account': 'authenticated',
  '/api/auth/signup': 'rateLimitedSignup',
  '/api/auth/password/reset': 'rateLimitedPasswordReset',
  '/api/auth/email/check': 'rateLimitedEmailCheck',
  '/api/checkout': 'rateLimitedCheckout',
  '/api/purchases/download/[id]': 'rateLimitedDownload',
  '/api/account/update-avatar': 'rateLimitedAvatarUpdate',
};

const redis = Redis.fromEnv();

const rateLimiters = {
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.signup.maxAttempts,
      `${RATE_LIMITS.signup.windowMs}ms`
    ),
  }),
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.passwordReset.maxAttempts,
      `${RATE_LIMITS.passwordReset.windowMs}ms`
    ),
  }),
  emailCheck: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.emailCheck.maxAttempts,
      `${RATE_LIMITS.emailCheck.windowMs}ms`
    ),
  }),
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.checkout.maxAttempts,
      `${RATE_LIMITS.checkout.windowMs}ms`
    ),
  }),
  download: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.download.maxAttempts,
      `${RATE_LIMITS.download.windowMs}ms`
    ),
  }),
  avatarUpdate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.avatarUpdate.maxAttempts,
      `${RATE_LIMITS.avatarUpdate.windowMs}ms`
    ),
  }),
};

// 有効なセッションが存在するか判定する関数
function hasValidSession(request: NextRequest) {
  const sessionToken = request.cookies.get('authjs.session-token');
  return !!sessionToken?.value;
}

// URLから商品IDを抽出する関数
function extractProductId(path: string): string | null {
  const match = path.match(/\/api\/purchases\/download\/([^\/]+)/);
  return match ? match[1] : null;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname as ProtectedRoute;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

  // レート制限が無効な場合はスキップ
  if (!RATE_LIMIT_ENABLED) {
    return NextResponse.next();
  }

  // 認証保護（/account）
  if (routeConfig[path] === 'authenticated' && !hasValidSession(request)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // サインアップのレート制限
  if (routeConfig[path] === 'rateLimitedSignup') {
    const { success, reset } = await rateLimiters.signup.limit(
      `${env}_signup:${ip}, Environment: ${env}`
    );
    if (!success) {
      console.error(`Signup rate limit exceeded - IP: ${ip}`);
      return NextResponse.json(
        {
          error:
            'アカウント作成の試行回数が制限を超えています。しばらく時間をおいて再度お試しください。',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // パスワードリセットのレート制限
  if (routeConfig[path] === 'rateLimitedPasswordReset') {
    const { success, reset } = await rateLimiters.passwordReset.limit(
      `${env}_password-reset:${ip}`
    );
    if (!success) {
      console.error(
        `Password reset rate limit exceeded - IP: ${ip}, Environment: ${env}`
      );
      return NextResponse.json(
        {
          error:
            'パスワードリセットの試行回数が制限を超えています。しばらく時間をおいて再度お試しください。',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // メールチェックのレート制限
  if (routeConfig[path] === 'rateLimitedEmailCheck') {
    const { success, reset } = await rateLimiters.emailCheck.limit(
      `${env}_email-check:${ip}`
    );
    if (!success) {
      console.error(
        `Email check rate limit exceeded - IP: ${ip}, Environment: ${env}`
      );
      return NextResponse.json(
        {
          error:
            '確認回数が制限を超えています。時間を置いて再度お試しください。',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // チェックアウトのレート制限
  if (routeConfig[path] === 'rateLimitedCheckout') {
    const { success, reset } = await rateLimiters.checkout.limit(
      `${env}_checkout:${ip}`
    );
    if (!success) {
      console.error(
        `Checkout rate limit exceeded - IP: ${ip}, Environment: ${env}`
      );
      return NextResponse.json(
        {
          error:
            '決済処理の試行回数が制限を超えています。しばらく時間をおいて再度お試しください。',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // ダウンロードのレート制限
  if (
    routeConfig[path] === 'rateLimitedDownload' ||
    path.startsWith('/api/purchases/download/')
  ) {
    const productId = extractProductId(path);
    if (!productId) {
      return new NextResponse('Invalid product ID', { status: 400 });
    }

    const { success, reset } = await rateLimiters.download.limit(
      `${env}_download:${productId}:${ip}`
    );

    if (!success) {
      console.error(
        `Download rate limit exceeded - IP: ${ip}, ProductId: ${productId}, Environment: ${env}`
      );
      return NextResponse.json(
        {
          error:
            'この商品のダウンロード回数が制限を超えました。しばらく時間をおいて再度お試しください。',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // アバター画像更新のレート制限
  if (routeConfig[path] === 'rateLimitedAvatarUpdate') {
    const { success, reset } = await rateLimiters.avatarUpdate.limit(
      `${env}_avatar-update:${ip}`
    );
    if (!success) {
      console.error(
        `Avatar update rate limit exceeded - IP: ${ip}, Environment: ${env}`
      );
      return NextResponse.json(
        {
          error:
            'プロフィール画像の更新回数が制限を超えています。しばらく時間をおいて再度お試しください。',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/api/auth/signup',
    '/api/auth/password/reset',
    '/api/auth/email/check',
    '/api/checkout',
    '/api/purchases/download/:path*',
    '/api/account/update-avatar',
  ],
};
