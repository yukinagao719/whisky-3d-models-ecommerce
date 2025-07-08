import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';

// レート制限設定
const RATE_LIMITS = {
  signup: { maxAttempts: 6, windowMs: 24 * 60 * 60 * 1000 },
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  emailCheck: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  checkout: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  download: { maxAttempts: 3, windowMs: 24 * 60 * 60 * 1000 },
  avatarUpdate: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
} as const;

// レート制限対象のルート設定
type ProtectedRoute =
  | '/account'
  | '/api/auth/signup'
  | '/api/auth/password/reset'
  | '/api/auth/email/check'
  | '/api/checkout'
  | '/api/purchases/download/[id]'
  | '/api/account/update-avatar';

type RouteConfig = {
  [K in ProtectedRoute]: 'authenticated' | 'rateLimitedSignup' | 'rateLimitedPasswordReset' | 'rateLimitedEmailCheck' | 'rateLimitedCheckout' | 'rateLimitedDownload' | 'rateLimitedAvatarUpdate';
};

const routeConfig: RouteConfig = {
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

// セッション判定関数
function hasValidSession(request: NextRequest) {
  const sessionToken =
    request.cookies.get('__Secure-authjs.session-token') ||
    request.cookies.get('authjs.session-token');
  return !!sessionToken?.value;
}

// 商品ID抽出関数
function extractProductId(path: string): string | null {
  const match = path.match(/\/api\/purchases\/download\/([^\/]+)/);
  return match ? match[1] : null;
}

// レート制限設定マップ
const rateLimitConfig = {
  rateLimitedSignup: {
    limiter: rateLimiters.signup,
    keyPrefix: 'signup',
    action: 'Signup',
    message: 'アカウント作成の試行回数が制限を超えています。しばらく時間をおいて再度お試しください。'
  },
  rateLimitedPasswordReset: {
    limiter: rateLimiters.passwordReset,
    keyPrefix: 'password-reset',
    action: 'Password reset',
    message: 'パスワードリセットの試行回数が制限を超えています。しばらく時間をおいて再度お試しください。'
  },
  rateLimitedEmailCheck: {
    limiter: rateLimiters.emailCheck,
    keyPrefix: 'email-check',
    action: 'Email check',
    message: '確認回数が制限を超えています。時間を置いて再度お試しください。'
  },
  rateLimitedCheckout: {
    limiter: rateLimiters.checkout,
    keyPrefix: 'checkout',
    action: 'Checkout',
    message: '決済処理の試行回数が制限を超えています。しばらく時間をおいて再度お試しください。'
  },
  rateLimitedAvatarUpdate: {
    limiter: rateLimiters.avatarUpdate,
    keyPrefix: 'avatar-update',
    action: 'Avatar update',
    message: 'プロフィール画像の更新回数が制限を超えています。しばらく時間をおいて再度お試しください。'
  }
} as const;

// 汎用レート制限チェック関数
async function checkRateLimit(
  config: typeof rateLimitConfig[keyof typeof rateLimitConfig],
  ip: string,
  env: string
): Promise<NextResponse | null> {
  const { success, reset } = await config.limiter.limit(`${env}_${config.keyPrefix}:${ip}`);
  
  if (!success) {
    console.error(`${config.action} rate limit exceeded - IP: ${ip}, Environment: ${env}`);
    return NextResponse.json(
      { error: config.message },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() }
      }
    );
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname as ProtectedRoute;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
  const env = process.env.NODE_ENV || 'development';

  // 認証保護（/account）
  if (routeConfig[path] === 'authenticated' && !hasValidSession(request)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // レート制限が無効な場合はスキップ
  if (!RATE_LIMIT_ENABLED) {
    return NextResponse.next();
  }

  // 通常のレート制限チェック
  const routeType = routeConfig[path] as keyof typeof rateLimitConfig;
  if (rateLimitConfig[routeType]) {
    const response = await checkRateLimit(rateLimitConfig[routeType], ip, env);
    if (response) return response;
  }

  // ダウンロード専用レート制限（商品IDを含む）
  if (routeConfig[path] === 'rateLimitedDownload' || path.startsWith('/api/purchases/download/')) {
    const productId = extractProductId(path);
    if (!productId) {
      return new NextResponse('Invalid product ID', { status: 400 });
    }

    const { success, reset } = await rateLimiters.download.limit(`${env}_download:${productId}:${ip}`);
    if (!success) {
      console.error(`Download rate limit exceeded - IP: ${ip}, ProductId: ${productId}, Environment: ${env}`);
      return NextResponse.json(
        { error: 'この商品のダウンロード回数が制限を超えました。しばらく時間をおいて再度お試しください。' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() }
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/api/auth/:path*', '/api/checkout', '/api/purchases/download/:path*', '/api/account/update-avatar'],
};