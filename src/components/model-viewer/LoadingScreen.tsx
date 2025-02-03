'use client';

import { useProgress } from '@react-three/drei';

export function LoadingScreen() {
  const { progress } = useProgress();
  const progressValue = progress.toFixed(0);

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      role="progressbar"
      aria-label="3Dモデルを読み込み中"
      aria-valuenow={Number(progressValue)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* 進捗表示 */}
      <div className="absolute text-xl">{progressValue}%</div>

      {/* 視覚的なローディングインジケーター */}
      <div className="w-32 h-1 bg-gray-700 rounded-full mt-12">
        <div
          className="h-full bg-accent-light rounded-full transition-all duration-300"
          style={{ width: `${progressValue}%` }}
        />
      </div>
    </div>
  );
}
