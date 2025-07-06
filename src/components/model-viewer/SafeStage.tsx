'use client';

import React, { useState, useEffect } from 'react';
import { Stage } from '@react-three/drei';
import { Model } from './Model';

type SafeStageProps = {
  modelUrl: string;
};

export function SafeStage({ modelUrl }: SafeStageProps) {
  const [useHDR, setUseHDR] = useState(true);
  const [hdrUrl, setHdrUrl] = useState<string | null>(null);

  useEffect(() => {
    // HDRファイルのURLを構築
    const cloudFrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (cloudFrontUrl) {
      setHdrUrl(`${cloudFrontUrl}/hdr/apartment.hdr`);
    } else {
      setUseHDR(false);
    }
  }, []);

  // HDR読み込みエラーのハンドリング
  const handleHDRError = () => {
    console.warn('HDR file loading failed, falling back to custom lighting');
    setUseHDR(false);
  };

  if (useHDR && hdrUrl) {
    return (
      <ErrorBoundary onError={handleHDRError}>
        <Stage
          environment={{
            files: hdrUrl,
          }}
          intensity={5}
          shadows={{
            type: 'contact',
            opacity: 0.2,
            blur: 3,
          }}
          adjustCamera={false}
          preset="rembrandt"
        >
          <Model url={modelUrl} />
        </Stage>
      </ErrorBoundary>
    );
  }

  // フォールバック: カスタム照明
  return (
    <>
      {/* ウイスキーボトル専用照明設定 */}
      <ambientLight intensity={0.3} />

      {/* 正面メインライト（ラベル専用） */}
      <directionalLight
        position={[0, 0, 10]}
        target-position={[0, 0, 0]}
        intensity={3.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* ボトル全体照明（上から・弱め） */}
      <directionalLight
        position={[0, 6, 3]}
        target-position={[0, 0, 0]}
        intensity={1.0}
        color="#ffffff"
        castShadow
      />

      {/* サイドライト（シンプル） */}
      <directionalLight
        position={[4, 1, 4]}
        target-position={[0, 0, 0]}
        intensity={1.2}
        color="#f8f8ff"
      />

      <directionalLight
        position={[-4, 1, 4]}
        target-position={[0, 0, 0]}
        intensity={1.2}
        color="#f8f8ff"
      />

      {/* 背面リムライト（ボトルの輪郭強調） */}
      <directionalLight
        position={[0, 2, -6]}
        target-position={[0, 0, 0]}
        intensity={0.2}
        color="#ffffff"
      />

      {/* ネックラベル専用ライト */}
      <pointLight position={[0, 3, 2]} intensity={1.5} color="#ffffff" />

      {/* ガラス反射用ライト */}
      <pointLight position={[2, 4, 2]} intensity={0.8} color="#e8f4ff" />
      <pointLight position={[-2, 4, 2]} intensity={0.8} color="#e8f4ff" />

      {/* 全体環境光（柔らかい補助光・弱め） */}
      <directionalLight position={[3, 8, 5]} intensity={0.3} color="#f0f8ff" />
      <directionalLight position={[-3, 8, 5]} intensity={0.3} color="#f0f8ff" />

      <Model url={modelUrl} />
    </>
  );
}

// エラーバウンダリーコンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('HDR loading error:', error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // フォールバックは親コンポーネントで処理
    }

    return this.props.children;
  }
}
