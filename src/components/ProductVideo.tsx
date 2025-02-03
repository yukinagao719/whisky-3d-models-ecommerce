'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

type ProductVideoProps = {
  videoUrl: string | null;
  imageUrl: string;
};

export default function ProductVideo({
  videoUrl,
  imageUrl,
}: ProductVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // マウント時の動画初期化
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  // ホバー時に動画を再生する関数
  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play();
  };

  // ホバー解除時に動画を停止し、開始位置に戻す関数
  const stopVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <div
      className="relative aspect-square w-full"
      onMouseEnter={playVideo}
      onMouseLeave={stopVideo}
    >
      {/* 動画URLが存在する場合のみ動画要素を表示 */}
      {videoUrl && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          className={`
           absolute inset-0 w-full h-full object-cover transition-opacity duration-300
           ${isLoaded ? 'opacity-100' : 'opacity-0'}
         `}
          onLoadedData={() => setIsLoaded(true)}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* 動画ロード完了までの代替画像表示 */}
      {!isLoaded && (
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt="Product image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={true}
          />
        </div>
      )}
    </div>
  );
}
