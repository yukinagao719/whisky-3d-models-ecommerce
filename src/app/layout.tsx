import type { Metadata } from 'next';
import { Noto_Sans_JP, Zen_Old_Mincho, Zen_Tokyo_Zoo } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Providers } from '@/providers/auth-provider';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

const zenOldMincho = Zen_Old_Mincho({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-zen-old-mincho',
  display: 'swap',
});

const zenTokyoZoo = Zen_Tokyo_Zoo({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-zen-tokyo-zoo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://3dwhiskyshop.com'),
  title: '3D/WHISKY|ウイスキーの美学をデジタルで紡ぎ直す',
  description:
    '伝統的なウイスキーボトルの美しさを3Dデジタルアートとして再構築。オリジナルデザインへの敬意を持ち、形状や素材感に独自の解釈を加え、現代のデジタル技術で新たな価値を創造する3Dモデル販売プラットフォーム。',
  keywords: '3Dモデル, ウイスキー, デジタルアート, 3Dデザイン, ボトルデザイン',
  authors: [{ name: 'Iyo' }],
  openGraph: {
    type: 'website',
    title: '3D/WHISKY|ウイスキーの美学をデジタルで紡ぎ直す',
    description:
      '伝統的なウイスキーボトルの美しさを3Dデジタルアートとして再構築。オリジナルデザインへの敬意を持ち、形状や素材感に独自の解釈を加え、現代のデジタル技術で新たな価値を創造する3Dモデル販売プラットフォーム。',
    siteName: '3D/WHISKY',
    locale: 'ja_JP',
    alternateLocale: ['en_US'],
    images: [
      {
        url: '/ogp-image_1200x630.png',
        width: 1200,
        height: 630,
        alt: '3D/WHISKY - ウイスキーの3Dモデル販売',
      },
    ],
  },
  icons: [
    {
      rel: 'icon',
      url: '/favicon_32x32.ico',
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon_180x180.jpg',
    },
    {
      rel: 'icon',
      url: '/icon_192x192.jpg',
      sizes: '192x192',
    },
  ],
  twitter: {
    card: 'summary_large_image',
    title: '3D/WHISKY|ウイスキーの美学をデジタルで紡ぎ直す',
    description:
      '伝統的なウイスキーボトルの美しさを3Dデジタルアートとして再構築。オリジナルデザインへの敬意を持ち、形状や素材感に独自の解釈を加え、現代のデジタル技術で新たな価値を創造する3Dモデル販売プラットフォーム。',
    images: ['/og-image.jpg'],
    creator: '@iyo_whisky',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariables = `${notoSansJP.variable} ${zenOldMincho.variable} ${zenTokyoZoo.variable}`;

  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${fontVariables} font-sans antialiased min-h-screen flex flex-col bg-background-primary`}
      >
        <Providers>
          <Header />
          <main className="flex-grow w-full mx-auto">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
