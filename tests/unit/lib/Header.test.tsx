import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';

jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// assetHelpers のモック
jest.mock('@/lib/assetHelpers', () => ({
  getAssetUrl: jest.fn().mockReturnValue('https://example.com/default-icon.png'),
}));

// constants のモック
jest.mock('@/lib/constants', () => ({
  DEFAULT_PATHS: {
    icon: 'default-icon.png',
  },
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header navigation', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<Header />);
    
    const nav = screen.getByRole('banner');
    expect(nav).toBeInTheDocument();
  });

  it('shows home and cart links', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<Header />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    const cartLink = screen.getByRole('link', { name: /cart/i });
    
    expect(homeLink).toBeInTheDocument();
    expect(cartLink).toBeInTheDocument();
  });

  it('shows loading skeleton when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    render(<Header />);
    
    const skeleton = screen.getByRole('banner');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows logout and account when user is authenticated', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    };

    mockUseSession.mockReturnValue({
      data: {
        user: mockUser,
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<Header />);
    
    const logoutButton = screen.getByText('Logout');
    const accountLink = screen.getByText('Account');
    
    expect(logoutButton).toBeInTheDocument();
    expect(accountLink).toBeInTheDocument();
  });
});