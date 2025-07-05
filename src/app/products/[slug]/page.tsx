import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/products';
import ProductDetail from './ProductDetail';

type ProductPageProps = {
  params: Promise<{
    // URLのスラッグパラメータ（{id}-{nameEn}の形式）
    slug: string;
  }>;
};

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
