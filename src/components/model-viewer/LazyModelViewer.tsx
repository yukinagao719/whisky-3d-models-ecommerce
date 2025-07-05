'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Three.js ModelViewer を遅延読み込み
const ModelViewer = dynamic(
  () => import('./ModelViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] lg:h-[500px] bg-background-secondary rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-accent-dark border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-text-secondary text-sm">Loading 3D Model...</p>
        </div>
      </div>
    ),
  }
);

type LazyModelViewerProps = {
  modelUrl: string;
  imageUrl: string;
  className?: string;
};

export default function LazyModelViewer({ 
  modelUrl, 
  imageUrl, 
  className = '' 
}: LazyModelViewerProps) {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsInView(true);
          setHasLoaded(true);
        }
      },
      {
        // トリガーを画面の50%手前に設定して事前読み込み
        rootMargin: '50% 0px',
        threshold: 0.1,
      }
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, [hasLoaded]);

  return (
    <div ref={containerRef} className={className}>
      {isInView ? (
        <ModelViewer modelUrl={modelUrl} imageUrl={imageUrl} />
      ) : (
        // プレースホルダー画像を表示
        <div className="w-full h-[400px] lg:h-[500px] bg-background-secondary rounded-lg flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <Image
              src={imageUrl} 
              alt="Product preview" 
              width={400}
              height={400}
              className="max-w-full max-h-full object-contain rounded-lg"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
            <p className="text-text-secondary text-sm mt-2">
              Scroll down to view 3D model
            </p>
          </div>
        </div>
      )}
    </div>
  );
}