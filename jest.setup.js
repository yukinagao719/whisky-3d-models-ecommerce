import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// モック設定
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// ResizeObserver のモック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// IntersectionObserver のモック
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// WebGL のモック (Three.js 用)
const mockGetContext = jest.fn(() => ({
  getShaderInfoLog: jest.fn(),
  getShaderParameter: jest.fn(),
  getShaderSource: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createShader: jest.fn(),
  deleteShader: jest.fn(),
  attachShader: jest.fn(),
  detachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  getProgramParameter: jest.fn(),
  getProgramInfoLog: jest.fn(),
  createProgram: jest.fn(),
  deleteProgram: jest.fn(),
  viewport: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  blendFunc: jest.fn(),
  depthFunc: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  vertexAttribPointer: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
}));

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext,
});

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// NextAuth のモック
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// 環境変数のモック
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  AUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
};