// CloudFrontからアセットのURLを生成するユーティリティ関数
export const getAssetUrl = (path: string | null) => {
  if (!path) return null;
  const baseUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_PUBLIC_URL;
  if (!baseUrl) {
    return path;
  }
  return `${baseUrl}${path}`;
};
