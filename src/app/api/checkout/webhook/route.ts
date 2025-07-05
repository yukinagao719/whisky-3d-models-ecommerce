/**
 * Stripe Webhook
 * - 決済完了時の処理を実行
 * - 注文データの作成
 * - ダウンロードトークンの生成
 * - 購入確認メールの送信
 */

import { stripe } from '@/lib/stripe-server';
import { headers } from 'next/headers';
import { generateToken } from '@/lib/token';
import { EmailType, sendPurchaseConfirmationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { generateOrderNumber } from '@/utils/order';
import type Stripe from 'stripe';

type CheckoutProduct = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
};

// Stripe商品情報からDB上の商品情報を検索
async function findMatchingProduct(
  stripeProduct: Stripe.Product
): Promise<Omit<CheckoutProduct, 'price'>> {
  const productId = stripeProduct.metadata.productId;

  const dbProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!dbProduct) {
    throw new Error('Product not found');
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    nameEn: dbProduct.nameEn,
  };
}

// 注文データの作成とダウンロードトークンの生成
async function createOrder(
  session: Stripe.Checkout.Session,
  checkoutProducts: CheckoutProduct[]
) {
  if (!session.customer_details?.email) {
    throw new Error('Customer email not found');
  }

  const order = await prisma.order.create({
    data: {
      userId: session.client_reference_id || null,
      orderEmail: session.customer_details.email!,
      orderNumber: generateOrderNumber(),
      status: 'COMPLETED',
      totalAmount: session.amount_total || 0,
      stripeSessionId: session.id,
      stripePaymentId: session.payment_intent as string,
      isPaid: true,
      paidAt: new Date(),
      items: {
        create: checkoutProducts.map((product) => ({
          productId: product.id,
          name: product.name,
          nameEn: product.nameEn,
          price: product.price,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  const downloadTokenRecord = await generateToken('DOWNLOAD', {
    identifier: session.customer_details.email,
    orderId: order.id,
    userId: session.client_reference_id || undefined,
  });

  return { order, downloadToken: downloadTokenRecord.token };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  try {
    // ①Stripeからのwebhookリクエストの署名を検証
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // ②決済完了イベントの処理
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.customer_details?.email) {
        throw new Error('Customer email not found');
      }

      // ③セッション情報から商品詳細を取得
      const sessionWithItems = await stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ['line_items.data.price.product'] }
      );

      // ④購入商品情報の作成
      const checkoutProducts = await Promise.all(
        sessionWithItems.line_items?.data.map(async (item) => {
          const stripeProduct = item.price?.product as Stripe.Product;
          const product = await findMatchingProduct(stripeProduct);
          return {
            ...product,
            price: item.amount_total || 0,
          };
        }) || []
      );

      try {
        // ⑤注文データとダウンロードトークンの作成
        const { order, downloadToken } = await createOrder(
          session,
          checkoutProducts
        );

        try {
          // ⑥購入確認メールの送信
          await sendPurchaseConfirmationEmail({
            type: EmailType.ORDER,
            email: session.customer_details.email,
            order: {
              orderNumber: order.orderNumber,
              items: order.items.map((item) => ({
                name: item.name,
                nameEn: item.nameEn,
                price: item.price,
              })),
              totalAmount: order.totalAmount,
            },
            downloadUrl: `${process.env.APP_URL}/download/${downloadToken}`,
            signupUrl: `${
              process.env.APP_URL
            }/signup?email=${encodeURIComponent(session.customer_details.email)}`,
            hasAccount: !!session.client_reference_id,
          });
        } catch (emailError) {
          console.error(
            'Failed to send purchase confirmation email:',
            emailError
          );
          return new Response('Failed to send confirmation email', {
            status: 500,
          });
        }
      } catch (orderError) {
        console.error('Failed to create order:', orderError);
        return new Response('Failed to create order', {
          status: 500,
        });
      }
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      'Webhook error: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      { status: 400 }
    );
  }
}
