import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

// デバイスがモバイルサイズかどうかを判定するカスタムフック
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  // ウィンドウサイズに基づくモバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // パフォーマンス最適化のためdebounce
    const debouncedCheckMobile = debounce(checkMobile, 200);

    window.addEventListener('resize', debouncedCheckMobile);

    // 初回チェック
    checkMobile();

    return () => window.removeEventListener('resize', debouncedCheckMobile);
  }, []);

  return isMobile;
}
