# 3D/WHISKY E-commerce

## 【概要】

ウイスキーの3Dモデルを閲覧・購入できるECサイトです。3Dモデルをインタラクティブに操作しながら、商品の詳細を確認できます。

⚠️ **注意**： このサイトはポートフォリオ用のデモサイトです。実際の商取引は行えません。Stripeの決済機能はテストモードで実装されています。

## 【URL】

**URL**： [3D/WHISKY](https://3dwhiskyshop.com/)

## 【機能】

### （認証・アカウント）

- OAuth認証（Google, GitHub）
- メール/パスワード認証
- アカウント管理（プロフィール編集、購入履歴）
- ゲスト購入

### （EC機能）

- 3Dモデルビューワー（React Three Fiber）
- カート機能
- Stripe決済（テストモード）
- 購入履歴

### （セキュリティ）

- 入力値バリデーション
- レート制限（サインアップ、ダウンロードなど）
- エラーハンドリング
- XSS/CSRF対策
- CloudFront署名付きURLによるプライベートコンテンツ保護
  - 開発環境と本番環境で分離された鍵管理
  - AWS Secrets Managerでの安全な秘密鍵の管理

## 【技術スタック】

### （フロントエンド）

- TypeScript
- Next.js (App Router)
- React Three Fiber / Three.js
- Zustand
- Tailwind CSS

### （バックエンド）

- Node.js
- Next.js API Routes
- Auth.js
- Stripe

### （データベース）

- Neon (Vercel Postgres)
- Prisma
- Upstash Redis

### （インフラ）

- AWS (S3, CloudFront)
- Vercel

### （開発ツール）

- ESLint
- Prettier

## 【デモ環境について】

### （デモアカウント）

デモアカウント情報は採用担当者様に直接共有させていただきます。

### （デモ環境で確認可能な機能）

1. **基本認証機能**

   - メール/パスワードでのログイン
   - ログアウト

2. **アカウント管理**

   - プロフィール変更（アバター画像、表示名）
   - 購入履歴の確認
   - アカウントの削除

3. **EC機能**
   - 3Dモデル操作
   - 商品の閲覧・カート操作
   - テストカードでの決済
   - 商品のダウンロード

### （デモ環境での制限事項）

以下の機能については、セキュリティとプライバシーの観点からデモ環境での確認が制限されています：

1. **認証関連**

   - OAuth認証（Google, GitHub）
   - 新規アカウント登録（メール認証）
   - パスワードリセット

2. **その他の制限**
   - ゲスト購入機能
   - 一部レート制限の確認
   - メール通知システム
   - ダウンロードトークンの有効期限確認（メール）
     - 購入直後：有効なダウンロードリンク
     - 期限切れ：1週間前の注文のダウンロードリンク

これらの機能については、**採用面接時に実環境での動作デモ**をさせていただきます。以下の項目について詳細な説明とデモンストレーションが可能です：

- 実際のOAuth認証フロー
- メール認証システムの動作
- セキュリティ機能（レート制限など）の実装詳細
- 本番環境でのメール通知システム

ソースコード内の実装詳細もご確認いただけます：

- `auth.ts`: 認証設定
- `middleware.ts`: レート制限の実装
- `email.ts`: メール通知システム

## 【テスト用決済について】

テストカード情報は採用担当者様に直接共有させていただきます。

## 【環境変数の設定】

プロジェクトルートに`.env`ファイルを作成し、以下の環境変数を設定してください。

```env
# アプリケーションのURL（開発環境の場合：http://localhost:3000）
APP_URL=

# データベース接続URL（Neon -Vercel Postgres）
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# OAuth認証プロバイダーの認証情報
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=

# Auth.jsの暗号化キー（openssl rand -base64 32で生成可能）
AUTH_SECRET=

# メール送信設定
FROM_EMAIL=
RESEND_API_KEY=

# Stripe決済（開発時はテストモードのキーを使用）
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Upstash Redis（レート制限用）
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AWS認証情報
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# AWS S3とCloudFrontの設定
S3_USER_BUCKET=
NEXT_PUBLIC_CLOUDFRONT_PUBLIC_URL=
CLOUDFRONT_USER_URL=
CLOUDFRONT_PRIVATE_URL=
CLOUDFRONT_KEY_PAIR_ID=  # CloudFrontパブリックキーのID

# レート制限の制御（true/false）
RATE_LIMIT_ENABLED=

```

## 【今後の改善点】

### （パフォーマンス最適化）

- 3Dモデルのレンダリング最適化（モデル圧縮とキャッシュ戦略の改善）

### （型安全性の強化）

- APIレスポンスの型定義の実装
- Zodを使用したランタイム型チェックの導入

### （テスト実装）

- Jestを使用したユニットテスト導入
- Playwrightなどによるe2eテスト実装
- APIエンドポイントの統合テスト追加

### （セキュリティ強化）

- Content Security Policy (CSP)の実装
- XSS対策の強化
- セキュリティヘッダーの最適化

### （監視・分析）

- エラーログ収集システムの導入
- パフォーマンスモニタリングの実装

### （開発・デプロイメントフロー）

- GitHub Actionsを使用したCI/CDパイプラインの構築
- 自動テストとデプロイの統合

## 【コントリビューション】

このプロジェクトはポートフォリオ用のため、プルリクエストは受け付けていません。
しかし、改善案やフィードバックはお受けいたします。

## 【ライセンス】

[MIT License](LICENSE)

## 【作者】

Yuki Nagao

- GitHub: [@yukinagao719](https://github.com/yukinagao719)
