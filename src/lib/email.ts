/**
 * メール送信サービス（簡素化版）
 * 共通テンプレート使用によりコードを大幅削減
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

export type EmailParams = VerificationEmailParams | ResetEmailParams | OrderEmailParams;

const resend = new Resend(process.env.RESEND_API_KEY);

// 共通スタイル定数
const STYLES = {
  container: 'max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, -apple-system, sans-serif;',
  header: 'text-align: center; margin-bottom: 40px;',
  title: 'color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0;',
  content: 'color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;',
  button: 'display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;',
  footer: 'color: #6b7280; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;'
};

// 共通メールテンプレート生成関数
function createEmailTemplate(title: string, content: string, actionButton?: string): string {
  return `
    <div style="${STYLES.container}">
      <div style="${STYLES.header}">
        <h1 style="${STYLES.title}">3D/WHISKY</h1>
      </div>
      
      <div style="${STYLES.content}">
        <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 20px;">${title}</h2>
        ${content}
        ${actionButton || ''}
      </div>
      
      <div style="${STYLES.footer}">
        <p>このメールに心当たりがない場合は、無視してください。</p>
        <p>© 2024 3D/WHISKY. All rights reserved.</p>
      </div>
    </div>
  `;
}

// メールタイプ別の設定
const EMAIL_CONFIG = {
  [EmailType.VERIFICATION]: {
    subject: 'メールアドレスの認証',
    getContent: (params: VerificationEmailParams) => ({
      title: 'メールアドレスの認証',
      content: `
        <p>アカウント作成ありがとうございます。</p>
        <p>以下のボタンをクリックして、メールアドレスの認証を完了してください：</p>
      `,
      actionButton: `<a href="${params.baseUrl}/auth/verify?token=${params.token}" style="${STYLES.button}">メールアドレスを認証する</a>`
    })
  },
  
  [EmailType.RESET]: {
    subject: 'パスワードリセット',
    getContent: (params: ResetEmailParams) => ({
      title: 'パスワードリセット',
      content: `
        <p>パスワードリセットのリクエストを受け付けました。</p>
        <p>以下のボタンをクリックして、新しいパスワードを設定してください：</p>
      `,
      actionButton: `<a href="${params.baseUrl}/auth/reset?token=${params.token}" style="${STYLES.button}">パスワードをリセットする</a>`
    })
  },
  
  [EmailType.ORDER]: {
    subject: 'ご購入ありがとうございました',
    getContent: (params: OrderEmailParams) => {
      const itemsList = params.order.items
        .map(item => `<li>${item.name}: ¥${item.price.toLocaleString()}</li>`)
        .join('');
      
      const accountInfo = params.hasAccount 
        ? '<p>ダウンロードは購入履歴からも可能です。</p>'
        : params.signupUrl 
          ? `<p><a href="${params.signupUrl}">アカウント作成</a>でより便利にご利用いただけます。</p>`
          : '';
      
      return {
        title: 'ご購入ありがとうございました',
        content: `
          <p>注文番号：<strong>${params.order.orderNumber}</strong></p>
          <ul style="margin: 20px 0;">${itemsList}</ul>
          <p>合計：<strong>¥${params.order.totalAmount.toLocaleString()}</strong></p>
          <p>以下のボタンから3Dモデルをダウンロードできます（7日間有効）：</p>
          ${accountInfo}
        `,
        actionButton: `<a href="${params.downloadUrl}" style="${STYLES.button}">3Dモデルをダウンロード</a>`
      };
    }
  }
};

// プレーンテキスト生成（HTMLタグを除去）
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const config = EMAIL_CONFIG[params.type];
    const { title, content, actionButton } = (config as {
      getContent: (params: EmailParams) => { title: string; content: string; actionButton: string };
    }).getContent(params);
    
    const html = createEmailTemplate(title, content, actionButton);
    const text = htmlToPlainText(content + (actionButton || ''));

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@3dwhisky.com',
      to: params.email,
      subject: config.subject,
      html,
      text,
    });

    if (result.error) {
      console.error('Email sending failed:', result.error);
      return { success: false, error: result.error.message };
    }

    // eslint-disable-next-line no-console
    console.log(`Email sent successfully: ${params.type} to ${params.email}`);
    return { success: true };

  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// 後方互換性のための個別送信関数
export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  return sendEmail({
    type: EmailType.VERIFICATION,
    email,
    token,
    baseUrl,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, baseUrl: string) {
  return sendEmail({
    type: EmailType.RESET,
    email,
    token,
    baseUrl,
  });
}

export async function sendPurchaseConfirmationEmail(
  email: string,
  order: {
    orderNumber: string;
    items: Array<{ name: string; price: number }>;
    totalAmount: number;
  },
  downloadUrl: string,
  signupUrl?: string,
  hasAccount?: boolean
) {
  return sendEmail({
    type: EmailType.ORDER,
    email,
    order,
    downloadUrl,
    signupUrl,
    hasAccount,
  });
}