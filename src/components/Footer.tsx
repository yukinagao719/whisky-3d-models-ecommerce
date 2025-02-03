import Link from 'next/link';
import XIcon from './icons/XIcon';
import PhotoShareIcon from './icons/PhotoShareIcon';

export default function Footer() {
  // 現在の年を取得（著作権表示用）
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="relative z-50 bg-accent-dark p-2 mt-auto"
    >
      <div className="mx-4 lg:mx-10 flex flex-col lg:flex-row justify-between items-center gap-2 lg:gap-0">
        {/* サイトタイトル - モバイルでは非表示 */}
        <p className="text-3xl hidden sm:block lg:text-4xl font-heading text-text-primary order-1">
          3D/Whisky
        </p>

        {/* デモ用のSNSリンク - 実際のアカウントへは遷移しません */}
        <nav
          aria-label="SNSリンク"
          className="flex space-x-2 items-center text-text-primary gap-2 order-2 lg:order-3"
        >
          <a
            href="#"
            className="hover:opacity-80"
            aria-label="X (Twitter)"
            rel="noopener noreferrer"
          >
            <XIcon />
          </a>
          <a
            href="#"
            className="hover:opacity-80"
            aria-label="Instagram"
            rel="noopener noreferrer"
          >
            <PhotoShareIcon />
          </a>
        </nav>

        {/* 法的リンクと著作権表示セクション */}
        <nav
          aria-label="法的情報"
          className="flex flex-col items-center text-text-secondary gap-2 text-xxs md:text-xs text-center lg:text-left order-3 lg:order-2"
        >
          <div className="flex space-x-2">
            <Link
              href="/legal/terms"
              className="hover:opacity-80 transition-opacity"
            >
              利用規約
            </Link>
            <Link
              href="/legal/privacy"
              className="hover:opacity-80 transition-opacity"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/legal/commercial"
              className="hover:opacity-80 transition-opacity"
            >
              特定商取引法に基づく表記
            </Link>
          </div>
          <small>© {currentYear} 3D/WHISKY All rights Reserved.</small>
        </nav>
      </div>
    </footer>
  );
}
