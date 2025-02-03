import Link from 'next/link';
import ProductVideo from './ProductVideo';
import { Product } from '@/types/shop';
import { capitalize } from '@/utils/string';

type ProductProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductProps) {
  const { name, nameEn, price, videoUrl, imageUrl } = product;

  return (
    // 商品詳細ページへのリンク
    <Link
      href={`/products/${product.id}-${product.nameEn}`}
      className="flex flex-col bg-background-secondary rounded-lg overflow-hidden shadow-md shadow-gray-700 duration-300 hover:translate-y-1 hover:shadow-none"
      aria-label={`${name}の詳細`}
    >
      {/* 商品のビデオ/画像表示コンポーネント */}
      <ProductVideo videoUrl={videoUrl} imageUrl={imageUrl} />

      {/* 商品情報セクション */}
      <div className="px-2 py-2 mt-2">
        <h2 className="text-sm xl:text-base text-center font-semibold text-text-primary">
          <span className="block">{name}</span>
          <span className="block">{capitalize(nameEn)}</span>
        </h2>
        <p
          className="mt-2 text-xs md:text-sm xl:text-base text-right text-text-secondary"
          aria-label={`価格： ${price.toLocaleString()} 円`}
        >
          ¥{price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
