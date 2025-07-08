'use client';

import React from 'react';
import { Model } from './Model';

type SafeStageProps = {
  modelUrl: string;
};

export function SafeStage({ modelUrl }: SafeStageProps) {
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
