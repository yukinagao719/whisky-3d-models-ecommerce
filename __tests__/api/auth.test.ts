// API関数の単体テスト
import { validateEmail, validatePassword } from '@/utils/validation';

describe('API Validation', () => {
  describe('User Registration Validation', () => {
    it('validates registration data correctly', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        name: 'Test User',
      };

      expect(validateEmail(validData.email)).toEqual({ isValid: true });
      expect(validatePassword(validData.password)).toEqual({ isValid: true });
    });

    it('rejects invalid registration data', () => {
      const invalidEmail = validateEmail('invalid-email');
      const invalidPassword = validatePassword('weak');

      expect(invalidEmail.isValid).toBe(false);
      expect(invalidPassword.isValid).toBe(false);
    });

    it('validates required fields', () => {
      expect(validateEmail('')).toEqual({
        isValid: false,
        error: 'メールアドレスを入力してください',
      });
      expect(validatePassword('')).toEqual({
        isValid: false,
        error: 'パスワードを入力してください',
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should have proper validation chain', () => {
      const testData = [
        { email: 'test@example.com', password: 'ValidPass123!', shouldPass: true },
        { email: 'invalid', password: 'ValidPass123!', shouldPass: false },
        { email: 'test@example.com', password: 'weak', shouldPass: false },
        { email: '', password: '', shouldPass: false },
      ];

      testData.forEach(({ email, password, shouldPass }) => {
        const emailValid = validateEmail(email).isValid;
        const passwordValid = validatePassword(password).isValid;
        const allValid = emailValid && passwordValid;

        expect(allValid).toBe(shouldPass);
      });
    });
  });
});