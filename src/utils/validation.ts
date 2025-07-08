// バリデーション結果の共通型
type ValidationResult = {
  isValid: boolean;
  error?: string;
};

// バリデーションルール定数
export const VALIDATION_RULES = {
  NAME: { MIN_LENGTH: 1, MAX_LENGTH: 30 },
  EMAIL: { REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, MAX_LENGTH: 254 },
  PASSWORD: { 
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    REQUIREMENTS: [
      'At least 8 characters',
      'At least 1 uppercase letter', 
      'At least 1 lowercase letter',
      'At least 1 number',
      'At least 1 special character (@$!%*?&)',
    ]
  },
  IMAGE: {
    MAX_FILE_SIZE: 500 * 1024, // 500KB
    MAX_INPUT_SIZE: 1024 * 1024, // 1MB
    MAX_DIMENSIONS: 256,
    OUTPUT_FORMAT: 'webp' as const,
    QUALITY: { INITIAL: 80, FALLBACK: 60 },
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  }
} as const;

// 汎用バリデーターファクトリー
function createValidator(
  rules: { 
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
  }
) {
  return (value: string): ValidationResult => {
    const trimmed = value.trim();
    
    if (!trimmed && rules.required) {
      return { isValid: false, error: rules.required };
    }
    
    if (rules.minLength && trimmed.length < rules.minLength.value) {
      return { isValid: false, error: rules.minLength.message };
    }
    
    if (rules.maxLength && trimmed.length > rules.maxLength.value) {
      return { isValid: false, error: rules.maxLength.message };
    }
    
    if (rules.pattern && !rules.pattern.value.test(trimmed)) {
      return { isValid: false, error: rules.pattern.message };
    }
    
    return { isValid: true };
  };
}

// 各バリデーター関数
export const validateName = createValidator({
  required: '名前を入力してください',
  minLength: { value: VALIDATION_RULES.NAME.MIN_LENGTH, message: '名前は1文字以上30文字以内で入力してください' },
  maxLength: { value: VALIDATION_RULES.NAME.MAX_LENGTH, message: '名前は1文字以上30文字以内で入力してください' }
});

export const validateEmail = createValidator({
  required: 'メールアドレスを入力してください',
  maxLength: { value: VALIDATION_RULES.EMAIL.MAX_LENGTH, message: 'メールアドレスが長すぎます' },
  pattern: { value: VALIDATION_RULES.EMAIL.REGEX, message: '有効なメールアドレスを入力してください' }
});

export const validatePassword = createValidator({
  required: 'パスワードを入力してください',
  minLength: { value: VALIDATION_RULES.PASSWORD.MIN_LENGTH, message: 'パスワードは8文字以上で設定してください' },
  pattern: { 
    value: VALIDATION_RULES.PASSWORD.PATTERN, 
    message: 'パスワードは大文字、小文字、数字、特殊文字を含む8文字以上で設定してください' 
  }
});

// 画像バリデーション（専用関数）
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'ファイルを選択してください' };
  }

  if (!VALIDATION_RULES.IMAGE.ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return { isValid: false, error: 'JPEG、PNG、WebP形式のファイルを選択してください' };
  }

  if (file.size > VALIDATION_RULES.IMAGE.MAX_INPUT_SIZE) {
    return { isValid: false, error: 'ファイルサイズは1MB以下にしてください' };
  }

  return { isValid: true };
}

// 後方互換性のためのエクスポート
export const NAME_VALIDATION = VALIDATION_RULES.NAME;
export const EMAIL_VALIDATION = VALIDATION_RULES.EMAIL; 
export const PASSWORD_VALIDATION = VALIDATION_RULES.PASSWORD;
export const IMAGE_VALIDATION = VALIDATION_RULES.IMAGE;
export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

// 後方互換性のための関数エイリアス
export const validateImage = validateImageFile;