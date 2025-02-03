// 名前のバリデーションルール
export const NAME_VALIDATION = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 30,
} as const;

// メールアドレスのバリデーションルール
export const EMAIL_VALIDATION = {
  REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MAX_LENGTH: 254,
} as const;

// パスワードのバリデーションルール
export const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8,
  // セキュリティ要件に基づくパスワードパターン
  PATTERN:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // ユーザー向けのパスワード要件説明
  REQUIREMENTS: [
    'At least 8 characters',
    'At least 1 uppercase letter',
    'At least 1 lowercase letter',
    'At least 1 number',
    'At least 1 special character (@$!%*?&)',
  ],
} as const;

// 許可される画像のMIMEタイプ
export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

// 画像のバリデーションルール
export const IMAGE_VALIDATION = {
  // 出力ファイルの最大サイズ (500KB)
  MAX_FILE_SIZE: 500 * 1024,
  // 入力ファイルの最大サイズ (1MB)
  MAX_INPUT_SIZE: 1024 * 1024,
  // 画像の最大サイズ
  MAX_DIMENSIONS: 256,
  // 変換後のフォーマット
  OUTPUT_FORMAT: 'webp' as const,
  // 画質設定
  QUALITY: {
    INITIAL: 80,
    FALLBACK: 60,
  },
  // 許可される形式
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

// 名前のバリデーション
export function validateName(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name.trim()) {
    return { isValid: false, error: '名前を入力してください' };
  }

  if (
    name.length < NAME_VALIDATION.MIN_LENGTH ||
    name.length > NAME_VALIDATION.MAX_LENGTH
  ) {
    return {
      isValid: false,
      error: '名前は1文字以上30文字以内で入力してください',
    };
  }

  return { isValid: true };
}

// メールアドレスのバリデーション
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (!email.trim()) {
    return { isValid: false, error: 'メールアドレスを入力してください' };
  }

  if (email.length > EMAIL_VALIDATION.MAX_LENGTH) {
    return {
      isValid: false,
      error: 'メールアドレスは254文字以内で入力してください',
    };
  }

  if (!EMAIL_VALIDATION.REGEX.test(email)) {
    return { isValid: false, error: '有効なメールアドレスを入力してください' };
  }

  return { isValid: true };
}

// パスワードのバリデーション
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (!password.trim()) {
    return { isValid: false, error: 'パスワードを入力してください' };
  }

  if (password.length < PASSWORD_VALIDATION.MIN_LENGTH) {
    return { isValid: false, error: 'パスワードは8文字以上で入力してください' };
  }

  if (!PASSWORD_VALIDATION.PATTERN.test(password)) {
    return { isValid: false, error: 'パスワードの形式が正しくありません' };
  }

  return { isValid: true };
}

// 画像のバリデーション
export function validateImage(file: File): {
  isValid: boolean;
  error?: string;
} {
  if (!IMAGE_VALIDATION.ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      isValid: false,
      error: 'PNG, JPEG, WebP形式のファイルのみアップロード可能です',
    };
  }

  if (file.size > IMAGE_VALIDATION.MAX_INPUT_SIZE) {
    return {
      isValid: false,
      error: 'ファイルサイズは1MB以下にしてください',
    };
  }

  return { isValid: true };
}
