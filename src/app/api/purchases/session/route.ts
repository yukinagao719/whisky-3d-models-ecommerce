/**
 * Stripe決済セッション情報取得API
 * - セッションIDに基づき顧客のメールアドレスを取得
 * - 購入完了後の顧客情報取得に使用
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

export const dynamic = 'force-dynamic';

type SessionResponse = {
  customerEmail: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'セッション情報が見つかりません' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const response: SessionResponse = {
      customerEmail: session.customer_details?.email || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'セッションを取得できませんでした' },
      { status: 500 }
    );
  }
}
