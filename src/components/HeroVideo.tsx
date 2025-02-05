'use client';

import { useEffect, useState } from 'react';

type VideoSources = {
  mobile: string | null;
  tablet: string | null;
  desktop: string | null;
};

type FallbackImages = {
  mobile: string | null;
  tablet: string | null;
  desktop: string | null;
};

type HeroVideoProps = {
  videoSources: VideoSources;
  fallbackImages: FallbackImages;
};

const HeroVideo = ({ videoSources, fallbackImages }: HeroVideoProps) => {
  const [currentSource, setCurrentSource] = useState<string | null>(null);

  useEffect(() => {
    // メディアクエリの定義
    const queries = [
      {
        query: '(max-width: 767px)',
        source: videoSources.mobile,
      },
      {
        query: '(max-width: 1279px)',
        source: videoSources.tablet,
      },
      {
        query: '(min-width: 1280px)',
        source: videoSources.desktop,
      },
    ];

    // 初期ソースの設定
    const setInitialSource = () => {
      const matchedQuery = queries.find(
        ({ query }) => window.matchMedia(query).matches
      );
      setCurrentSource(matchedQuery?.source || videoSources.desktop);
    };

    // 初回実行
    setInitialSource();

    // メディアクエリリスナーの設定
    const mediaQueryListeners = queries.map(({ query, source }) => {
      const mql = window.matchMedia(query);
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setCurrentSource(source);
        }
      };

      // 非推奨のaddListenerの代わりにaddEventListenerを使用
      mql.addEventListener('change', listener);
      return { mql, listener };
    });

    // クリーンアップ
    return () => {
      mediaQueryListeners.forEach(({ mql, listener }) => {
        mql.removeEventListener('change', listener);
      });
    };
  }, [videoSources]);

  if (!currentSource) return null;

  return (
    <div className="absolute top-0 w-full h-full">
      <video
        key={currentSource}
        autoPlay
        muted
        loop
        playsInline
        aria-label="ウイスキーボトルのヒーロー動画"
        className="w-full h-full object-cover"
      >
        <source src={currentSource} type="video/mp4" />
        {/* フォールバック画像 */}
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={fallbackImages.mobile || ''}
          />
          <source
            media="(max-width: 1279px)"
            srcSet={fallbackImages.tablet || ''}
          />
          <img
            src={fallbackImages.desktop || ''}
            alt="Whisky bottle hero image"
            className="w-full h-full object-cover"
          />
        </picture>
      </video>
    </div>
  );
};

export default HeroVideo;
