'use client';

import { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';

// デバイスサイズに応じたテキスト繰り返し回数の定義
const REPEAT_COUNT = {
  mobile: 8,
  desktop: 15,
} as const;

// スクロール表示するテキストの定義
const TEXT = '3D/WHISKY';

export default function ScrollingText() {
  const [count, setCount] = useState<number>(REPEAT_COUNT.mobile);

  // パフォーマンス最適化:
  // - debounceで不必要な再レンダリングを防止
  // - 依存配列を空にして意図的にESLintルールを無視
  // - リサイズイベントの処理を最小限に抑制
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleResize = useCallback(() => {
    const debouncedResize = debounce(() => {
      setCount(
        window.innerWidth >= 768 ? REPEAT_COUNT.desktop : REPEAT_COUNT.mobile
      );
    }, 200);
    debouncedResize();
    return debouncedResize;
  }, []);

  // 初期表示時のカウント設定
  useEffect(() => {
    const resizeHandler = handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      resizeHandler.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // テキストの繰り返しセットを生成する関数
  const renderTextSet = (keyPrefix: string) => (
    <div className="flex">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={`${keyPrefix}-${index}`}
          className="font-zen text-4xl md:text-6xl lg:text-7xl text-text-tertiary mx-2 md:mx-3 lg:mx-4 leading-relaxed py-1 md:py-1.5 lg:py-2 transition-all duration-300"
        >
          {TEXT}
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden whitespace-nowrap">
      {/* 左方向への無限スクロール */}
      <div className="inline-flex animate-scroll-left">
        {renderTextSet('first')}
        {renderTextSet('second')}
      </div>
    </div>
  );
}
