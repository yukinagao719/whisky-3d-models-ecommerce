import {
  validateEmail,
  validatePassword,
  validateImage,
  validateName,
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true });
      expect(validateEmail('user.name@domain.co.jp')).toEqual({ isValid: true });
      expect(validateEmail('test+tag@example.org')).toEqual({ isValid: true });
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toEqual({
        isValid: false,
        error: '有効なメールアドレスを入力してください',
      });
      expect(validateEmail('@example.com')).toEqual({
        isValid: false,
        error: '有効なメールアドレスを入力してください',
      });
      expect(validateEmail('test@')).toEqual({
        isValid: false,
        error: '有効なメールアドレスを入力してください',
      });
      expect(validateEmail('')).toEqual({
        isValid: false,
        error: 'メールアドレスを入力してください',
      });
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toEqual({ isValid: true });
      expect(validatePassword('MySecure2024@')).toEqual({ isValid: true });
      expect(validatePassword('Complex1@')).toEqual({ isValid: true });
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toEqual({
        isValid: false,
        error: 'パスワードは8文字以上で設定してください',
      });
      expect(validatePassword('12345678')).toEqual({
        isValid: false,
        error: 'パスワードは大文字、小文字、数字、特殊文字を含む8文字以上で設定してください',
      });
      expect(validatePassword('password')).toEqual({
        isValid: false,
        error: 'パスワードは大文字、小文字、数字、特殊文字を含む8文字以上で設定してください',
      });
      expect(validatePassword('Password')).toEqual({
        isValid: false,
        error: 'パスワードは大文字、小文字、数字、特殊文字を含む8文字以上で設定してください',
      });
      expect(validatePassword('Password1')).toEqual({
        isValid: false,
        error: 'パスワードは大文字、小文字、数字、特殊文字を含む8文字以上で設定してください',
      });
    });

    it('rejects short passwords', () => {
      expect(validatePassword('Short1!')).toEqual({
        isValid: false,
        error: 'パスワードは8文字以上で設定してください',
      });
      expect(validatePassword('Aa1!')).toEqual({
        isValid: false,
        error: 'パスワードは8文字以上で設定してください',
      });
    });
  });

  describe('validateName', () => {
    it('validates correct names', () => {
      expect(validateName('Test User')).toEqual({ isValid: true });
      expect(validateName('田中太郎')).toEqual({ isValid: true });
    });

    it('rejects invalid names', () => {
      expect(validateName('')).toEqual({
        isValid: false,
        error: '名前を入力してください',
      });
      expect(validateName('   ')).toEqual({
        isValid: false,
        error: '名前を入力してください',
      });
    });
  });

  describe('validateImage', () => {
    it('validates correct image files', () => {
      const validJpeg = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const validPng = new File([''], 'test.png', { type: 'image/png' });
      const validWebp = new File([''], 'test.webp', { type: 'image/webp' });

      expect(validateImage(validJpeg)).toEqual({ isValid: true });
      expect(validateImage(validPng)).toEqual({ isValid: true });
      expect(validateImage(validWebp)).toEqual({ isValid: true });
    });

    it('rejects invalid file types', () => {
      const invalidTxt = new File([''], 'test.txt', { type: 'text/plain' });
      const invalidPdf = new File([''], 'test.pdf', { type: 'application/pdf' });
      
      expect(validateImage(invalidTxt)).toEqual({
        isValid: false,
        error: 'JPEG、PNG、WebP形式のファイルを選択してください',
      });
      expect(validateImage(invalidPdf)).toEqual({
        isValid: false,
        error: 'JPEG、PNG、WebP形式のファイルを選択してください',
      });
    });

    it('rejects files that are too large', () => {
      const largeFile = new File(
        [new ArrayBuffer(2 * 1024 * 1024)], // 2MB
        'large.jpg',
        { type: 'image/jpeg' }
      );
      
      expect(validateImage(largeFile)).toEqual({
        isValid: false,
        error: 'ファイルサイズは1MB以下にしてください',
      });
    });
  });
});