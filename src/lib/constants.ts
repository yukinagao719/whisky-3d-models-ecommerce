// ヒーローセクション用のレスポンシブ対応メディアパス定義
export const HERO_PATHS = {
  videos: {
    mobile: '/videos/hero/mobile/ichiro_s_malt_minibottle_hero_720x1280.mp4',
    tablet: '/videos/hero/tablet/ichiro_s_malt_minibottle_hero_1280x960.mp4',
    desktop: '/videos/hero/desktop/ichiro_s_malt_minibottle_hero_2560x1440.mp4',
  },
  images: {
    mobile: '/images/hero/mobile/ichiro_s_malt_minibottle_hero_720x1280.webp',
    tablet: '/images/hero/tablet/ichiro_s_malt_minibottle_hero_1280x960.webp',
    desktop:
      '/images/hero/desktop/ichiro_s_malt_minibottle_hero_2560x1440.webp',
  },
} as const;

// デフォルトアセットのパス定義
export const DEFAULT_PATHS = {
  icon: '/images/icon/default_icon.png',
  productImage: '/images/products/default_product.webp',
} as const;
