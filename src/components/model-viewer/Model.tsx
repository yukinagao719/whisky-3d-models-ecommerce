'use client';

import { useState, useEffect } from 'react';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function Model({ url }: { url: string }) {
  const [error, setError] = useState<Error | null>(null);
  const { gl } = useThree();

  // WebGLコンテキストの監視
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setError(new Error('WebGL context lost. Please refresh the page.'));
    };

    const handleContextRestored = () => {
      setError(null);
      // 必要に応じてモデルを再読み込み
      gl.setSize(gl.domElement.width, gl.domElement.height);
    };

    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  // GLTFモデルの読み込み
  const gltf = useLoader(
    GLTFLoader,
    url,
    (loader) => {
      // ローダーの設定をカスタマイズ
      loader.setCrossOrigin('anonymous');
    },
    (e) => {
      // ローディングエラーのハンドリング
      const error = new Error(
        e instanceof Error ? e.message : 'Failed to load model'
      );
      setError(error);
    }
  );

  // エラーが発生した場合は上位のErrorBoundaryでキャッチ
  if (error) {
    throw error;
  }

  // モデルのメモリ管理を改善
  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時にリソースを解放
      if (gltf) {
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            }
          }
        });
      }
    };
  }, [gltf]);

  // モデルの描画
  return (
    <primitive
      object={gltf.scene}
      position={[0, 0, 0]}
      scale={1.2}
      dispose={null} // Three.jsに自動的なdisposeを防ぐように指示
    />
  );
}
