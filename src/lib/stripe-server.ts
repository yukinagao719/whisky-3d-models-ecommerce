import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

// サーバーサイド用Stripeインスタンスの初期化
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // @ts-expect-error - Stripe CLI uses newer API version for webhook compatibility
  apiVersion: '2025-01-27.acacia',
});
