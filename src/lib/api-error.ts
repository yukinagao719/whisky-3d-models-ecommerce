import { NextResponse } from 'next/server';

// APIエラーコードの定義
export enum APIErrorCode {
  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // 認証・認可エラー
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // リソースエラー
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  
  // ビジネスロジックエラー
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  ALREADY_PURCHASED = 'ALREADY_PURCHASED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DOWNLOAD_LIMIT_EXCEEDED = 'DOWNLOAD_LIMIT_EXCEEDED',
  
  // システムエラー
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // デモ制限エラー
  DEMO_USER_RESTRICTION = 'DEMO_USER_RESTRICTION',
  
  // 予期せぬエラー
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// APIエラーレスポンスの型定義
export interface APIErrorResponse {
  error: string; // ユーザー向けエラーメッセージ
  code: APIErrorCode; // プログラム処理用エラーコード
  details?: Record<string, unknown>; // 追加のエラー詳細
  redirect?: string; // リダイレクト先（必要な場合）
}

// APIエラークラス
export class APIError extends Error {
  constructor(
    public code: APIErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
    public redirect?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// 事前定義されたエラー
export const COMMON_ERRORS = {
  // 認証関連
  AUTHENTICATION_REQUIRED: new APIError(
    APIErrorCode.AUTHENTICATION_REQUIRED,
    '認証が必要です',
    401
  ),
  
  INVALID_CREDENTIALS: new APIError(
    APIErrorCode.INVALID_CREDENTIALS,
    'メールアドレスまたはパスワードが正しくありません',
    401
  ),
  
  TOKEN_EXPIRED: new APIError(
    APIErrorCode.TOKEN_EXPIRED,
    'トークンの有効期限が切れています',
    401
  ),
  
  TOKEN_INVALID: new APIError(
    APIErrorCode.TOKEN_INVALID,
    '無効なトークンです',
    401
  ),
  
  INSUFFICIENT_PERMISSIONS: new APIError(
    APIErrorCode.INSUFFICIENT_PERMISSIONS,
    'この操作を実行する権限がありません',
    403
  ),
  
  // リソース関連
  USER_NOT_FOUND: new APIError(
    APIErrorCode.USER_NOT_FOUND,
    'ユーザーが見つかりません',
    404
  ),
  
  PRODUCT_NOT_FOUND: new APIError(
    APIErrorCode.PRODUCT_NOT_FOUND,
    '商品が見つかりません',
    404
  ),
  
  ORDER_NOT_FOUND: new APIError(
    APIErrorCode.ORDER_NOT_FOUND,
    '注文が見つかりません',
    404
  ),
  
  // ビジネスロジック関連
  EMAIL_ALREADY_EXISTS: new APIError(
    APIErrorCode.EMAIL_ALREADY_EXISTS,
    'このメールアドレスは既に使用されています',
    400
  ),
  
  DEMO_USER_RESTRICTION: new APIError(
    APIErrorCode.DEMO_USER_RESTRICTION,
    'デモユーザーはこの機能を使用できません',
    403
  ),
  
  // システム関連
  DATABASE_ERROR: new APIError(
    APIErrorCode.DATABASE_ERROR,
    'データベースエラーが発生しました',
    500
  ),
  
  INTERNAL_ERROR: new APIError(
    APIErrorCode.INTERNAL_ERROR,
    '予期せぬエラーが発生しました',
    500
  ),
} as const;

// エラーハンドリング関数
export function handleAPIError(error: unknown): NextResponse {
  // APIErrorの場合
  if (error instanceof APIError) {
    console.error(`API Error [${error.code}]:`, error.message, error.details);
    
    const response: APIErrorResponse = {
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
      ...(error.redirect && { redirect: error.redirect }),
    };
    
    return NextResponse.json(response, { status: error.statusCode });
  }
  
  // Prismaエラーの場合
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    
    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return handleAPIError(new APIError(
          APIErrorCode.VALIDATION_ERROR,
          '既に存在するデータです',
          400,
          { constraint: prismaError.meta?.target }
        ));
        
      case 'P2025': // Record not found
        return handleAPIError(new APIError(
          APIErrorCode.RESOURCE_NOT_FOUND,
          'データが見つかりません',
          404
        ));
        
      default:
        console.error('Prisma error:', prismaError);
        return handleAPIError(COMMON_ERRORS.DATABASE_ERROR);
    }
  }
  
  // 予期せぬエラーの場合
  console.error('Unexpected error:', error);
  
  // 本番環境では詳細なエラー情報を隠す
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment && error instanceof Error 
    ? error.message 
    : '予期せぬエラーが発生しました';
    
  const response: APIErrorResponse = {
    error: errorMessage,
    code: APIErrorCode.INTERNAL_ERROR,
    ...(isDevelopment && error instanceof Error && { 
      details: { stack: error.stack } 
    }),
  };
  
  return NextResponse.json(response, { status: 500 });
}

// バリデーションエラーヘルパー
export function createValidationError(
  message: string, 
  field?: string
): APIError {
  return new APIError(
    APIErrorCode.VALIDATION_ERROR,
    message,
    400,
    field ? { field } : undefined
  );
}

// リダイレクト付きエラーヘルパー
export function createRedirectError(
  code: APIErrorCode,
  message: string,
  redirectTo: string,
  statusCode: number = 401
): APIError {
  return new APIError(code, message, statusCode, undefined, redirectTo);
}