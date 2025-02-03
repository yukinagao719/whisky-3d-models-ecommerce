'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, ShoppingCart, Menu, LogOut } from 'lucide-react';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/assetHelpers';
import { DEFAULT_PATHS } from '@/lib/constants';

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      // デモユーザーの場合、データをリセット
      if (session?.user.email?.includes('demo@')) {
        await fetch('/api/demo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      await signOut({ callbackUrl: '/', redirect: false });
      router.push('/');
    } catch {}
  };

  // 認証状態ロード中のスケルトンUI
  if (status === 'loading') {
    return (
      <header
        role="banner"
        className="fixed z-50 top-0 w-full bg-background-tertiary"
      >
        <nav className="w-full h-10 md:h-12 px-4 md:px-12 flex items-center justify-end gap-2 md:gap-5">
          <div className="h-8 w-20 bg-gray-800 animate-pulse rounded"></div>
          <div className="h-8 w-8 bg-gray-800 animate-pulse rounded-full hidden md:block"></div>
        </nav>
      </header>
    );
  }

  return (
    <header
      role="banner"
      className="fixed z-50 top-0 w-full bg-background-tertiary"
    >
      <nav
        aria-label="メインナビゲーション"
        className="w-full h-10 md:h-12 px-4 md:px-12 flex items-center justify-between md:justify-end gap-2 md:gap-5"
      >
        {/* ハンバーガーメニュー（モバイルのみ） */}
        <button
          className="md:hidden text-text-primary transition-transform duration-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="オープンメニュー"
          aria-expanded={isMenuOpen}
          aria-controls="nav-menu"
        >
          <Menu
            size={20}
            className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* ナビゲーションメニュー */}
        <div
          id="nav-menu"
          role="navigation"
          className={`
          fixed md:relative top-10 md:top-0 left-0 w-full md:w-auto bg-background-primary md:bg-transparent py-2 md:py-0 px-4 md:px-0 gap-4 md:gap-5 items-start md:flex md:items-center
          ${isMenuOpen ? 'flex flex-col' : 'hidden'}
        `}
        >
          {/* ホームリンク */}
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity flex items-center text-text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            <Home
              size={20}
              strokeWidth={2.0}
              className="hidden md:inline-flex"
              aria-hidden="true"
            />
            <span className="md:hidden">Home</span>
          </Link>

          {/* カートリンク */}
          <Link
            href="/cart"
            className="hover:opacity-80 transition-opacity flex items-center text-text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            <ShoppingCart
              size={20}
              strokeWidth={2.0}
              className="hidden md:inline-flex"
              aria-hidden="true"
            />
            <span className="md:hidden">Cart</span>
          </Link>

          {/* 認証状態に応じた表示切り替え */}
          {status === 'authenticated' ? (
            <>
              {/* ログアウトボタン */}
              <button
                onClick={handleLogout}
                className="hover:opacity-80 transition-opacity text-text-primary md:text-md flex items-center"
                aria-label="ログアウト"
              >
                <LogOut
                  size={20}
                  strokeWidth={2.0}
                  className="hidden md:inline-flex mr-1"
                  aria-hidden="true"
                />
                <span>Logout</span>
              </button>

              <Link
                href="/account"
                className="hover:opacity-80 transition-opacity text-text-primary order-last"
                onClick={() => setIsMenuOpen(false)}
                aria-label="アカウント設定"
              >
                <Image
                  src={
                    session.user.image || getAssetUrl(DEFAULT_PATHS.icon) || ''
                  }
                  alt="User avatar"
                  width={30}
                  height={30}
                  className="hidden md:inline-flex rounded-full"
                  priority
                />
                <span className="md:hidden">Account</span>
              </Link>
            </>
          ) : (
            // ログイン/サインアップボタン
            <Link
              href="/login"
              className="hover:opacity-80 transition-opacity text-text-primary md:text-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Login / Sign up
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
