'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback } from './ErrorFallback';
import { LoadingScreen } from './LoadingScreen';
import { SafeStage } from './SafeStage';
import { useIsMobile } from './hooks/useIsMobile';

type ModelViewerProps = {
  modelUrl: string | null;
  imageUrl: string;
};

export default function ModelViewer({ modelUrl, imageUrl }: ModelViewerProps) {
  // モバイルサイズかどうかの判定
  const isMobile = useIsMobile();

  // モデルURLが存在しない場合はエラーフォールバックを表示
  if (!modelUrl) {
    return <ErrorFallback imageUrl={imageUrl} />;
  }

  return (
    // 3Dビューワーのコンテナ
    <div
      aria-label="3Dモデルビューワー"
      role="region"
      className="w-full relative h-[calc(100vh-85px)] md:aspect-[16/9] lg:h-[600px]"
    >
      <Suspense
        fallback={
          <div
            aria-label="3Dモデルを読み込み中"
            role="status"
            className="w-full h-full flex items-center justify-center text-text-primary"
          >
            <LoadingScreen />
          </div>
        }
      >
        <ErrorBoundary fallback={<ErrorFallback imageUrl={imageUrl} />}>
          <Canvas
            aria-label="3Dモデル表示キャンバス"
            // カメラの設定
            camera={{
              position: [0, 2, 10],
              fov: 40,
              near: 0.1,
              far: 100,
            }}
            // レンダリングの設定
            gl={{
              antialias: true,
              preserveDrawingBuffer: true,
              powerPreference: 'high-performance',
              failIfMajorPerformanceCaveat: true,
              outputColorSpace: THREE.SRGBColorSpace, // sRGB色空間を明示的に設定
            }}
            onCreated={({ gl }) => {
              // レンダラーの追加設定
              gl.toneMapping = THREE.NoToneMapping;
              gl.toneMappingExposure = 1;
            }}
          >
            {/* 背景色の設定 */}
            <color attach="background" args={['#1C1C1C']} />

            {/* 3Dモデルの表示環境設定（フォールバック付き） */}
            <SafeStage modelUrl={modelUrl} />

            {/* 3Dモデルの操作制御 */}
            <OrbitControls
              enablePan={false}
              minDistance={3}
              maxDistance={10}
              minPolarAngle={Math.PI / 50}
              maxPolarAngle={Math.PI / 2.1}
              enableDamping
              dampingFactor={0.05}
              target={[0, 2.5, 0]}
              enableZoom={true}
              mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.ROTATE,
              }}
              touches={{
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN,
              }}
              rotateSpeed={isMobile ? 0.7 : 1}
            />
          </Canvas>
        </ErrorBoundary>
      </Suspense>

      {/* 操作方法の説明 */}
      <div
        role="tooltip"
        className="absolute bottom-4 left-4 text-xxs md:text-sm text-text-secondary bg-background-secondary px-3 py-1 rounded-full backdrop-blur-sm"
      >
        {isMobile
          ? 'スワイプで回転 • ピンチでズーム'
          : 'ドラッグで回転 • スクロールでズーム'}
      </div>
    </div>
  );
}
