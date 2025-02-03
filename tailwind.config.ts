import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // フォント設定
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
        zen: ['var(--font-zen-old-mincho)', 'serif'],
        heading: ['var(--font-zen-tokyo-zoo)', 'sans-serif'],
      },
      // フォントサイズ設定
      fontSize: {
        xxs: ['0.625rem', '0.875rem'],
        xs: ['0.75rem', '1rem'],
        sm: ['0.875rem', '1.25rem'],
        base: ['1rem', '1.5rem'],
        lg: ['1.125rem', '1.75rem'],
        xl: ['1.25rem', '1.75rem'],
        '2xl': ['1.5rem', '2rem'],
        '3xl': ['1.875rem', '2.25rem'],
        '4xl': ['2.25rem', '2.5rem'],
        '5xl': ['2rem', '2.5rem'],
        '6xl': ['3rem', '3.5rem'],
        '7xl': ['4rem', '4.5rem'],
        '8xl': ['6rem', '6.5rem'],
      },
      // カラーパレット
      colors: {
        primary: {
          DEFAULT: '#0D0E1E',
          light: '#1C1C1C',
          dark: '#0D1117',
        },
        accent: {
          DEFAULT: '#C28540',
          light: '#C4A023',
          dark: '#806A00',
        },
        background: {
          primary: '#151515',
          secondary: '#1C1C1C',
          tertiary: '#00000080',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E2E8F0',
          tertiary: '#ffffff33',
        },
        status: {
          success: {
            DEFAULT: '#4CAF50',
            light: '#E8F5E9',
            dark: '#2E7D32',
            border: '#81C784',
          },
          error: {
            DEFAULT: '#DC2626',
            light: '#FEE2E2',
            dark: '#B91C1C',
            border: '#EF4444',
          },
          warning: {
            DEFAULT: '#F59E0B',
            light: '#FEF3C7',
            dark: '#D97706',
            border: '#FBBF24',
          },
          info: {
            DEFAULT: '#3B82F6',
            light: '#EFF6FF',
            dark: '#2563EB',
            border: '#60A5FA',
          },
        },
      },
      // フォーム設定
      form: {
        input: {
          bg: '#1C1C1C',
          border: '#374151',
          focus: '#3B82F6',
          placeholder: '#6B7280',
        },
        disabled: {
          bg: '#374151',
          text: '#9CA3AF',
        },
      },
      // アニメーション設定
      animation: {
        'scroll-left': 'scrollLeft 400s linear infinite',
        'tracking-in-expand':
          'tracking-in-expand 2s cubic-bezier(0.215, 0.610, 0.355, 1.000) both',
      },
      keyframes: {
        scrollLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'tracking-in-expand': {
          '0%': {
            'letter-spacing': '-.5em',
            opacity: '0',
          },
          '40%': {
            opacity: '.6',
          },
          to: {
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
