/**
 * Stripe Checkout セッション作成API
 * - 決済金額制限：1,000円 ~ 50,000円
 * - 冪等性制御：タイムスタンプとカート内容に基づくキー生成
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { stripe } from '@/lib/stripe-server';
import { prisma } from '@/lib/prisma';
import { CartItem } from '@/types/shop';
import { getAssetUrl } from '@/lib/assetHelpers';

const MAX_AMOUNT = 50000;
const MIN_AMOUNT = 1000;

type CheckoutRequest = {
  items: CartItem[];
  email?: string;
};

function getStripeImageUrls(imageUrl: string): string[] {
  const fullUrl = getAssetUrl(imageUrl);
  return fullUrl ? [fullUrl] : [];
}

export async function POST(request: Request) {
  try {
    // ①リクエストデータの検証
    const { items, email } = (await request.json()) as CheckoutRequest;

    if (!items.length) {
      return NextResponse.json({ error: 'カートが空です' }, { status: 400 });
    }

    // ②金額制限のチェック
    const total = items.reduce((sum, item) => sum + item.price, 0);
    if (total > MAX_AMOUNT) {
      return NextResponse.json(
        { error: '決済上限額を超えています（上限: 50,000円）' },
        { status: 400 }
      );
    }
    if (total < MIN_AMOUNT) {
      return NextResponse.json(
        { error: '決済最小額を下回っています（下限: 1,000円）' },
        { status: 400 }
      );
    }

    // ③商品情報の検証（DBとの整合性チェック）
    const productsFromDB = await prisma.product.findMany({
      where: {
        id: {
          in: items.map((item) => item.id),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
      },
    });

    const verificationErrors = items.reduce((errors: string[], item) => {
      const dbProduct = productsFromDB.find(
        (product) => product.id === item.id
      );

      if (!dbProduct) {
        errors.push(`対象の商品が見つかりません`);
      } else if (dbProduct.price !== item.price) {
        errors.push(`商品価格が更新されています。カートを更新してください。`);
      }

      return errors;
    }, []);

    if (verificationErrors.length > 0) {
      console.error('Product verification failed:', verificationErrors);
      return NextResponse.json(
        { error: verificationErrors[0] },
        { status: 400 }
      );
    }

    // ④Stripeセッションの作成
    const session = await auth();

    // ⑤冪等性キーの生成
    const idempotencyKey = uuidv4();

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      client_reference_id: session?.user?.id,
      payment_method_types: ['card'],
      customer_email: email,
      line_items: productsFromDB.map((product) => ({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: product.name,
            images: getStripeImageUrls(product.imageUrl),
            metadata: {
              productId: product.id,
            },
          },
          unit_amount: product.price,
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cart`,
    };

    const stripeSession = await stripe.checkout.sessions.create(
      sessionOptions,
      { idempotencyKey }
    );

    return NextResponse.json({ sessionId: stripeSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        error: '決済処理の開始に失敗しました。時間をおいて再度お試しください。',
      },
      { status: 500 }
    );
  }
}
