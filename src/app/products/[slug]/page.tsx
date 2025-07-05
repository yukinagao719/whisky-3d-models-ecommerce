import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProduct } from '@/lib/products';
import ProductDetail from './ProductDetail';

type ProductPageProps = {
  params: Promise<{
    // URLのスラッグパラメータ（{id}-{nameEn}の形式）
    slug: string;
  }>;
};

// 動的メタデータ生成
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productId = resolvedParams.slug.split('-')[0];
  const product = await getProduct(productId);

  if (!product) {
    return {
      title: '商品が見つかりません | 3D/WHISKY',
      description: '指定された商品が見つかりませんでした。',
    };
  }

  return {
    title: `${product.name} | 3D/WHISKY`,
    description: product.description || `${product.name}の3Dモデル - 高品質なウイスキーボトルの3Dアセット`,
    openGraph: {
      title: `${product.name} | 3D/WHISKY`,
      description: product.description || `${product.name}の3Dモデル - 高品質なウイスキーボトルの3Dアセット`,
      images: [
        {
          url: product.imageUrl,
          width: 800,
          height: 600,
          alt: `${product.name} - 3Dモデル`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | 3D/WHISKY`,
      description: product.description || `${product.name}の3Dモデル - 高品質なウイスキーボトルの3Dアセット`,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  // スラッグから商品IDを抽出
  const productId = resolvedParams.slug.split('-')[0];

  // 商品情報の取得
  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
