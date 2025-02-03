import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripeクライアントのインスタンスをシングルトンとして保持
let stripePromise: Promise<Stripe | null> | null = null;

// Stripeクライアントの初期化と取得を行う関数
export const getStripePromise = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error('Stripe publishable key is not defined');
    }

    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }

  return stripePromise;
};
