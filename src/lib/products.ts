import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Product as PrismaProduct } from '@prisma/client';
import { getAssetUrl } from './assetHelpers';
import { DEFAULT_PATHS } from './constants';

// PrismaのProduct型からURL関連フィールドを除外し、処理済みのURL形式で再定義
export interface Product
  extends Omit<PrismaProduct, 'videoUrl' | 'imageUrl' | 'modelUrl'> {
  videoUrl: string | null;
  imageUrl: string;
  modelUrl: string | null;
}

// Prismaの製品データをアプリケーション用に変換（URLをCloudFront形式に変換）
function transformProduct(product: PrismaProduct): Product {
  return {
    ...product,
    videoUrl: getAssetUrl(product.videoUrl),
    imageUrl:
      getAssetUrl(product.imageUrl) ||
      getAssetUrl(DEFAULT_PATHS.productImage) ||
      '',
    modelUrl: getAssetUrl(product.modelUrl),
  };
}

// 指定IDの製品データを取得
export async function getProduct(id: string): Promise<Product> {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) notFound();
  return transformProduct(product);
}

// 全製品データを表示順で取得
export async function getAllProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: {
      displayOrder: 'asc',
    },
  });

  return products.map(transformProduct);
}
