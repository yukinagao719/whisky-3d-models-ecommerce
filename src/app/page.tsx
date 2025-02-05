import DemoNotice from '@/components/DemoNotice';
import ProductCard from '@/components/ProductCard';
import ScrollingText from '@/components/ScrollingText';
import { getAllProducts } from '@/lib/products';
import { getAssetUrl } from '@/lib/assetHelpers';
import { HERO_PATHS } from '@/lib/constants';

// レスポンシブ対応のビデオソースを定義
const VIDEO_SOURCES = {
  mobile: getAssetUrl(HERO_PATHS.videos.mobile),
  tablet: getAssetUrl(HERO_PATHS.videos.tablet),
  desktop: getAssetUrl(HERO_PATHS.videos.desktop),
};

// レスポンシブ対応のビデオソースを定義
const FALLBACK_IMAGES = {
  mobile: getAssetUrl(HERO_PATHS.images.mobile),
  tablet: getAssetUrl(HERO_PATHS.images.tablet),
  desktop: getAssetUrl(HERO_PATHS.images.desktop),
};

export default async function Home() {
  // 商品データの取得
  const products = await getAllProducts();

  return (
    <main>
      {/* ヒーローセクション */}
      <header className="relative h-screen flex justify-start items-center">
        <h1 className="absolute z-10 font-heading text-text-primary w-full text-center text-6xl left-1/2 -translate-x-1/2 md:text-7xl xl:w-auto xl:text-8xl xl:text-left xl:left-[10%] xl:translate-x-0 animate-tracking-in-expand">
          3D/Whisky
        </h1>
        {/* レスポンシブ対応のバックグラウンドビデオ */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-label="ウイスキーボトルのヒーロー動画"
          className="absolute top-0 w-full h-full object-cover"
        >
          {/* デバイスサイズに応じたソース設定 */}
          <source
            media="(max-width: 767px)"
            src={VIDEO_SOURCES.mobile || ''}
            type="video/mp4"
          />
          <source
            media="(max-width: 1279px)"
            src={VIDEO_SOURCES.tablet || ''}
            type="video/mp4"
          />
          <source src={VIDEO_SOURCES.desktop || ''} type="video/mp4" />
          {/* ビデオ非対応環境用のフォールバック画像 */}
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={FALLBACK_IMAGES.mobile || ''}
            />
            <source
              media="(max-width: 1279px)"
              srcSet={FALLBACK_IMAGES.tablet || ''}
            />
            <img
              src={FALLBACK_IMAGES.desktop || ''}
              alt="Whisky bottle hero image"
              className="w-full h-full object-cover"
            />
          </picture>
        </video>
      </header>

      <DemoNotice />

      {/* コンセプトセクション */}
      <section
        aria-labelledby="concept-heading"
        className="flex flex-col items-center mt-20 md:mt-28 lg:mt-40 mb-10 md:mb-12 lg:mb-16 px-4"
      >
        <h2
          id="concept-heading"
          className="text-center font-zen text-lg sm:text-3xl md:text-4xl lg:text-6xl mb-4 text-text-primary"
        >
          ウイスキーの美学をデジタルで紡ぎ直す
        </h2>
        <div className="w-full max-w-[950px] h-px mb-4 md:mb-6 lg:mb-8 bg-accent-dark" />
        <p className="text-center font-zen text-sm md:text-lg lg:text-xl text-text-secondary leading-relaxed md:leading-loose lg:leading-10 tracking-wider lg:tracking-widest">
          伝統的なウイスキーボトルの美しさを
          <br className="md:hidden" />
          現代のデジタル技術で再構築するために
          <br />
          3D/WHISKYは誕生しました。
          <br />
          オリジナルデザインへの敬意を持ち、
          <br className="md:hidden" />
          形状や素材感に独自の解釈を加えることで、
          <br />
          3Dデジタルアートとして新たな価値を創造。
        </p>
      </section>

      {/* スクロールテキストセクション */}
      <section className="mb- md:mb-16 lg:mb-20">
        <ScrollingText />
      </section>

      {/* 商品一覧セクション */}
      <section
        aria-labelledby="lineup-heading"
        className="mt-10 md:mt-28 lg:mt-40 px-4 container mx-auto mb-10"
      >
        <h2
          id="lineup-heading"
          className="text-center font-zen text-xl md:text-4xl lg:text-6xl mb-6 md:mb-8 lg:mb-10 text-text-primary"
        >
          LINE UP
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mx-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
