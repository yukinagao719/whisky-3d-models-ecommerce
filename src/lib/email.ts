/**
 * メール送信サービス
 * メールの種類ごとに型安全な送信を実現する
 *
 * 機能：
 * - Resend APIを使用したメール送信
 * - 共通スタイルを使用したレスポンシブメールテンプレート
 * - HTMLとプレーンテキストの自動生成
 *
 * 対応メールタイプ（EmailType）：
 * - VERIFICATION: メールアドレス認証（24時間有効）
 *   - 必須: email, token, baseUrl
 *
 * - RESET: パスワードリセット（1時間有効）
 *   - 必須: email, token, baseUrl
 *
 * - ORDER: 購入完了通知（ダウンロードリンク：7日間有効）
 *   - 必須: email, order, downloadUrl
 *   - オプション: signupUrl, hasAccount
 */

import { Resend } from 'resend';

// メールの種類を定義
export enum EmailType {
  VERIFICATION = 'VERIFICATION',
  RESET = 'RESET',
  ORDER = 'ORDER',
}

type BaseEmailParams = {
  email: string;
};

type VerificationEmailParams = BaseEmailParams & {
  type: EmailType.VERIFICATION;
  token: string;
  baseUrl: string;
};

type ResetEmailParams = BaseEmailParams & {
  type: EmailType.RESET;
  token: string;
  baseUrl: string;
};

type OrderEmailParams = BaseEmailParams & {
  type: EmailType.ORDER;
  order: {
    orderNumber: string;
    items: Array<{ name: string; price: number }>;
    totalAmount: number;
  };
  downloadUrl: string;
  signupUrl?: string;
  hasAccount?: boolean;
};

export type EmailParams =
  | VerificationEmailParams
  | ResetEmailParams
  | OrderEmailParams;

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type EmailResult = {
  success: boolean;
  error?: Error | unknown;
  messageId?: string;
};

// 共通のスタイル定義
const commonStyles = `
  .button {
    background-color: black;
    border-radius: 4px;
    color: white !important;
    padding: 12px 24px;
    text-decoration: none !important;
    display: block;
    width: fit-content;
    font-weight: bold;
  }
  .button:hover, 
  .button:visited, 
  .button:active {
    color: white !important;
  }
  .container {
    padding: 24px;
    max-width: 600px;
    margin: 0 auto;
    font-family: system-ui, -apple-system, sans-serif;
    color: black;
    text-align: left;
  }
  .footer-text {
    font-size: 12px;
    color: #666;
  }
  .warning-box {
    background-color: #FEF9C3;
    border: 1px solid #EAB308;
    border-radius: 4px;
    padding: 16px;
    margin: 16px 0;
  }
  .order-details {
    background-color: #F3F4F6;
    border-radius: 4px;
    padding: 16px;
    margin: 16px 0;
  }
`;

// メールアドレス認証用テンプレート
const createVerificationEmail = (
  params: VerificationEmailParams
): EmailTemplate => {
  // URLエンコード済みのトークンでリンクを生成
  const verifyEmailUrl = `${params.baseUrl}/email/verify/${encodeURIComponent(params.token)}`;
  return {
    subject: 'メールアドレスの確認 - 3D/Whisky Shop',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>${commonStyles}</style>
        </head>
        <body>
          <div class="container">
            <h1>メールアドレスの確認</h1>
            <p>以下のリンクをクリックしてメールアドレスを確認してください：</p>
            <a href="${verifyEmailUrl}" class="button">メールアドレスを確認</a>
            <p>このリンクは24時間後に期限切れとなります。</p>
            <p>このメールに心当たりがない場合は、無視してください。</p>
            <hr />
            <p class="footer-text">これは自動送信メールです。返信はできません。</p>
          </div>
        </body>
      </html>
    `,
    text: `
      メールアドレスの確認\n\n
      以下のリンクをクリックしてメールアドレスを確認してください：\n
      ${verifyEmailUrl}\n\n
      このリンクは24時間後に期限切れとなります。\n\n
      このメールに心当たりがない場合は、無視してください。\n\n
      ---\n
      これは自動送信メールです。返信はできません。
    `,
  };
};

// パスワードリセット用テンプレート
const createResetEmail = (params: ResetEmailParams): EmailTemplate => {
  // URLエンコード済みのトークンでリンクを生成
  const resetPasswordUrl = `${params.baseUrl}/password/confirm/${encodeURIComponent(params.token)}`;
  return {
    subject: 'パスワードリセット - 3D/WHISKY SHOP',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>${commonStyles}</style>
        </head>
        <body>
          <div class="container">
            <h1>パスワードリセット</h1>
            <p>以下のリンクをクリックしてパスワードをリセットしてください：</p>
            <a href="${resetPasswordUrl}" class="button">パスワードをリセット</a>
            <p>このリンクは1時間後に期限切れとなります。</p>
            <p>このメールに心当たりがない場合は、無視してください。</p>
            <hr />
            <p class="footer-text">これは自動送信メールです。返信はできません。</p>
          </div>
        </body>
      </html>
    `,
    text: `
      パスワードリセット\n\n
      以下のリンクをクリックしてパスワードをリセットしてください：\n
      ${resetPasswordUrl}\n\n
      このリンクは1時間後に期限切れとなります。\n\n
      このメールに心当たりがない場合は、無視してください。\n\n
      ---\n
      これは自動送信メールです。返信はできません。
    `,
  };
};

// 注文確認用テンプレート
const createOrderEmail = (params: OrderEmailParams): EmailTemplate => {
  const { order, downloadUrl, signupUrl, hasAccount } = params;
  return {
    subject: `ご購入ありがとうございます - 注文番号: ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>${commonStyles}</style>
        </head>
        <body>
          <div class="container">
            <h1>ご購入完了のお知らせ</h1>
            <p>この度はご購入いただき、誠にありがとうございます。</p>
            
            <p>以下のリンクから商品をダウンロードできます：</p>
            <a href="${downloadUrl}" class="button">ダウンロード</a>
            <p><small>${
              hasAccount
                ? 'アカウントページからいつでも商品をダウンロードできます。'
                : '※ダウンロードリンクは7日間有効です'
            }</small></p>

            <div class="warning-box">
              <h3>${
                hasAccount
                  ? 'アカウントページのご利用について'
                  : '⚠️ アカウント作成のお勧め'
              }</h3>
              <ul>
                ${
                  hasAccount
                    ? `
                    <li>アカウントページから商品を再ダウンロードいただけます</li>
                    <li>今後のアップデート情報もアカウントページでご確認いただけます</li>
                    <li>サポートが必要な場合もアカウントページからご連絡ください</li>
                    `
                    : `
                    <li>アカウントを作成せずにダウンロードリンクの有効期限が切れた場合、再度ダウンロードすることができなくなります</li>
                    <li>アカウントを作成することで、いつでも商品にアクセスできます</li>
                    <li>今後のアップデートやサポートもアカウントを通じて提供されます</li>
                    `
                }
              </ul>
              <a href="${
                hasAccount ? `${process.env.APP_URL}/account` : signupUrl
              }" 
                class="button${!hasAccount ? ' warning-button' : ''}">${
                  hasAccount ? 'アカウントページへ' : 'アカウントを作成'
                }</a>
            </div>

            <div class="order-details">
              <h2>【ご注文内容】</h2>
              <p>注文番号: ${order.orderNumber}</p>
              <pre>${order.items
                .map((item) => `${item.name}: ¥${item.price.toLocaleString()}`)
                .join('\n')}</pre>
              <hr />
              <p><strong>合計金額: ¥${order.totalAmount.toLocaleString()}</strong></p>
            </div>

            <hr />
            <p class="footer-text">これは自動送信メールです。返信はできません。</p>
          </div>
        </body>
      </html>
    `,
    text: `
      ご購入完了のお知らせ\n\n
      この度はご購入いただき、誠にありがとうございます。\n\n
      以下のリンクから商品をダウンロードできます：\n
      ${downloadUrl}\n\n
      ${
        hasAccount
          ? 'アカウントページからいつでも商品をダウンロードできます。'
          : '※ダウンロードリンクは7日間有効です'
      }\n\n
      ${hasAccount ? 'アカウントページのご利用について' : '⚠️ アカウント作成のお勧め'}\n
      ${
        hasAccount
          ? `・アカウントページから商品を再ダウンロードいただけます
          ・今後のアップデート情報もアカウントページでご確認いただけます
          ・サポートが必要な場合もアカウントページからご連絡ください`
          : `・アカウントを作成せずにダウンロードリンクの有効期限が切れた場合、再度ダウンロードすることができなくなります
          ・アカウントを作成することで、いつでも商品にアクセスできます
          ・今後のアップデートやサポートもアカウントを通じて提供されます`
      }\n\n
      ${
        hasAccount
          ? `アカウントページ: ${process.env.APP_URL}/account`
          : `アカウント作成: ${signupUrl}`
      }\n\n
      【ご注文内容】\n
      注文番号: ${order.orderNumber}\n
      ${order.items
        .map((item) => `${item.name}: ¥${item.price.toLocaleString()}`)
        .join('\n')}\n
      合計金額: ¥${order.totalAmount.toLocaleString()}\n\n
      ---\n
      これは自動送信メールです。返信はできません。
    `,
  };
};

// テンプレート取得関数
const getEmailTemplate = (params: EmailParams): EmailTemplate => {
  switch (params.type) {
    case EmailType.VERIFICATION:
      return createVerificationEmail(params);
    case EmailType.RESET:
      return createResetEmail(params);
    case EmailType.ORDER:
      return createOrderEmail(params);
  }
};

// メール送信関数
const sendEmail = async (params: EmailParams): Promise<EmailResult> => {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
    throw new Error('Missing required environment variables');
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const template = getEmailTemplate(params);

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: params.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.data?.id) {
      throw new Error('Failed to send email: No response data');
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};

// 用途別のエクスポート関数
export const sendVerificationEmail = (params: EmailParams) => sendEmail(params);
export const sendPasswordResetEmail = (params: EmailParams) =>
  sendEmail(params);
export const sendPurchaseConfirmationEmail = (params: EmailParams) =>
  sendEmail(params);
