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
      // プログレスイベントは除外してエラーのみをハンドリング
      if (e instanceof ProgressEvent && e.type === 'progress') {
        return; // プログレスイベントはエラーではない
      }

      console.error('GLTF loading error:', e);
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

  // マテリアルとテクスチャの調整
  useEffect(() => {
    if (gltf?.scene) {
      gltf.scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {

            if (
              material instanceof THREE.MeshStandardMaterial ||
              material instanceof THREE.MeshPhysicalMaterial
            ) {
              // テクスチャの確認と設定
              if (material.map) {
                material.map.flipY = false; // GLBファイルの場合、通常はfalse
                material.map.needsUpdate = true;
              }

              // ガラスマテリアルの透明度調整
              if (
                material.name &&
                (material.name.toLowerCase().includes('glass') ||
                  material.name.includes('Glass'))
              ) {

                // ガラスの透明度を調整（より不透明に）
                material.opacity = 0.3; // 80%の不透明度でガラス感を保ちつつ見やすく
                material.transparent = true;
                material.roughness = 0.3; // 非常に滑らか
                material.metalness = 0.1; // 金属感を除去

                if (material instanceof THREE.MeshPhysicalMaterial) {
                  material.transmission = 0.8; // 透過率を下げる（より不透明に）
                  material.thickness = 0.3; // ガラスの厚み感を増加
                  material.ior = 1.52; // ガラスの屈折率
                  material.reflectivity = 0.1; // 反射を抑制
                }

              }

              // その他マテリアル設定の調整
              material.toneMapped = false;
              material.transparent = material.opacity < 1;
              material.alphaTest = 0.1;
              material.side = THREE.FrontSide;
              material.needsUpdate = true;

            }
          });
        }
      });
    }
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
