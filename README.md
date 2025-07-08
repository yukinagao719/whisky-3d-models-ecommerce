# 3D Whisky E-commerce

ウイスキーの3Dモデルを閲覧・購入できるモダンなECサイトです。
React Three Fiberを使用したインタラクティブな3Dビューワーで、商品を360度回転させながら詳細を確認できます。

⚠️ **注意**: このサイトはポートフォリオ用のデモサイトです。実際の商取引は行えません。

🌐 **デモサイト**: [3D/WHISKY](https://3dwhiskyshop.com/)

## ✨ 主な機能

### 🔐 認証・アカウント管理

- **マルチプロバイダー認証**: OAuth（Google, GitHub）とメール/パスワード認証
- **プロフィール管理**: アバター画像、表示名の編集
- **購入履歴**: 注文詳細とダウンロードリンクの管理
- **ゲスト購入**: アカウント不要での購入対応

### 🛒 EC機能

- **3Dモデルビューワー**: React Three Fiberによるインタラクティブな商品閲覧
- **カート機能**: 商品の追加・削除・数量管理
- **決済処理**: Stripe統合によるセキュアな決済（テストモード）
- **購入後ダウンロード**: 期限付きトークンによる安全なファイル配信

### 🔒 セキュリティ・パフォーマンス

- **入力値検証**: Zodを使用した厳密な型チェック
- **レート制限**: API呼び出し頻度の制御（Redis使用）
- **コンテンツ保護**: CloudFront署名付きURLによるプライベートファイル配信
- **CSP対応**: Content Security Policyによる攻撃防御
- **エラーハンドリング**: 包括的なエラー処理とログ記録

## 🛠 技術スタック

### Frontend

- **TypeScript** - 型安全な開発環境
- **Next.js 14** - App Routerによるモダンなフルスタックフレームワーク
- **React Three Fiber** - 3Dグラフィックスレンダリング
- **Zustand** - 軽量状態管理
- **Tailwind CSS** - ユーティリティファーストCSS

### Backend & API

- **Next.js API Routes** - サーバーレスAPI
- **Auth.js** - 認証ライブラリ
- **Stripe** - 決済処理
- **Prisma** - データベースORM

### Database & Cache

- **Neon (Vercel Postgres)** - クラウドPostgreSQL
- **Upstash Redis** - レート制限・キャッシュ

### Infrastructure

- **Vercel** - ホスティング・デプロイ
- **AWS S3** - ファイルストレージ
- **AWS CloudFront** - CDN・コンテンツ配信

### Development Tools

- **ESLint** - コード品質管理
- **Prettier** - コードフォーマット
- **Playwright** - E2Eテスト

## 🎯 デモ環境・テスト情報

### 🔑 デモアカウント

デモアカウント情報については**お問い合わせください**。

### ✅ デモ環境で確認可能な機能

#### 認証・アカウント機能

- ✅ メール/パスワードでのログイン・ログアウト
- ✅ プロフィール編集（アバター画像・表示名変更）
- ✅ 購入履歴の確認
- ✅ アカウント削除

#### EC機能

- ✅ 3Dモデルのインタラクティブ操作
- ✅ 商品閲覧・カート機能
- ✅ Stripeテスト決済
- ✅ 購入後ファイルダウンロード

### ⚠️ デモ環境での制限事項

**セキュリティとプライバシー保護のため、以下は制限されています：**

#### 認証関連

- ❌ OAuth認証（Google, GitHub）
- ❌ 新規アカウント登録・メール認証
- ❌ パスワードリセット機能

#### その他の制限

- ❌ ゲスト購入機能
- ❌ レート制限の動作確認
- ❌ メール通知システム
- ❌ トークン期限切れ確認

### 💳 テスト決済情報

Stripeテストカード情報については**お問い合わせください**。

## ⚙️ 開発環境セットアップ

### 📋 必要な環境変数

プロジェクトルートに`.env`ファイルを作成し、以下を設定してください。

```env
# アプリケーション基本設定
APP_URL=http://localhost:3000

# データベース（Neon - Vercel Postgres）
POSTGRES_PRISMA_URL=your_postgres_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url

# 認証（OAuth）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
AUTH_SECRET=your_auth_secret  # openssl rand -base64 32

# メール送信（Resend）
FROM_EMAIL=your_from_email
RESEND_API_KEY=your_resend_api_key

# 決済（Stripe）
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis（レート制限）
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# AWS（ファイルストレージ）
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-1
S3_USER_BUCKET=your_s3_bucket
NEXT_PUBLIC_CLOUDFRONT_PUBLIC_URL=your_cloudfront_url
CLOUDFRONT_USER_URL=your_cloudfront_user_url
CLOUDFRONT_PRIVATE_URL=your_cloudfront_private_url
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id

# デモユーザー設定
DEMO_USER_EMAIL=your_demo_email
DEMO_USER_PASSWORD=your_demo_password
DEMO_NEW_USER_EMAIL=your_new_demo_email
DEMO_NEW_USER_PASSWORD=your_new_demo_password

# 機能制御
RATE_LIMIT_ENABLED=true
```

### 🚀 起動手順

```bash
# 依存関係のインストール
npm install

# データベースの初期化
npx prisma generate
npx prisma db push
npx prisma db seed

# 開発サーバーの起動
npm run dev

# Stripe webhookの起動（別ターミナル）
stripe listen --forward-to localhost:3000/api/checkout/webhook
```

## 🔄 今後の改善計画

### 📈 パフォーマンス最適化

- 3Dモデルの圧縮・最適化
- 画像の遅延読み込み・WebP対応
- キャッシュ戦略の改善

### 🧪 テスト拡張

- ユニットテストカバレッジの向上
- E2Eテストシナリオの追加（現在基本実装済み）
- パフォーマンステストの実装

### 📊 監視・分析

- エラーログ収集システム（Sentry等）
- リアルタイムパフォーマンス監視
- ユーザー行動分析の導入

### 🔧 開発効率化

- GitHub Actions CI/CDパイプライン
- 自動デプロイ・ロールバック機能

---

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 👨‍💻 作者

**Yuki Nagao**

- 📧 Email: ynagao719@gmail.com
- 🐙 GitHub: [@yukinagao719](https://github.com/yukinagao719)

---

> 💡 **フィードバック・ご質問について**  
> このプロジェクトはポートフォリオ用途のため、プルリクエストは受け付けておりませんが、技術的なご質問やフィードバックは歓迎いたします。お気軽にご連絡ください。
