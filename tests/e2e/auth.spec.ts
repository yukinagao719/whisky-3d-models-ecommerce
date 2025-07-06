import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ホームページの基本表示確認', async ({ page }) => {
    // ヘッダーの確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('3D/WHISKY')).toBeVisible();

    // ナビゲーションメニューの確認
    await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
    await expect(page.getByRole('link', { name: '商品一覧' })).toBeVisible();

    // ログインボタンの確認
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('ログインモーダルの表示と閉じる操作', async ({ page }) => {
    // ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();

    // モーダルが表示されることを確認
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('アカウントにログイン')).toBeVisible();

    // メール/パスワードログインフォームの確認
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();

    // OAuth ボタンの確認
    await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'GitHubでログイン' })).toBeVisible();

    // モーダルを閉じる
    await page.getByRole('button', { name: '閉じる' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('無効なメールアドレスでのログイン試行', async ({ page }) => {
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 無効なメールアドレスを入力
    await page.getByLabel('メールアドレス').fill('invalid-email');
    await page.getByLabel('パスワード').fill('password123');
    
    // ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // エラーメッセージの確認
    await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible();
  });

  test('空のフィールドでのログイン試行', async ({ page }) => {
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 空のままログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // バリデーションメッセージの確認
    await expect(page.getByText('メールアドレスを入力してください')).toBeVisible();
    await expect(page.getByText('パスワードを入力してください')).toBeVisible();
  });

  test('サインアップページへの遷移', async ({ page }) => {
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // サインアップリンクをクリック
    await page.getByRole('link', { name: 'アカウントを作成' }).click();
    
    // サインアップフォームの確認
    await expect(page.getByText('アカウントを作成')).toBeVisible();
    await expect(page.getByLabel('名前')).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByLabel('パスワード（確認）')).toBeVisible();
  });

  test('ゲスト購入リンクの確認', async ({ page }) => {
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // ゲスト購入リンクの確認
    await expect(page.getByRole('link', { name: 'ゲストとして購入' })).toBeVisible();
    
    // リンクをクリックしてページ遷移を確認
    await page.getByRole('link', { name: 'ゲストとして購入' }).click();
    await expect(page).toHaveURL('/products');
  });

  test('パスワードリセットページへの遷移', async ({ page }) => {
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // パスワードリセットリンクをクリック
    await page.getByRole('link', { name: 'パスワードをお忘れですか？' }).click();
    
    // パスワードリセットフォームの確認
    await expect(page.getByText('パスワードリセット')).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByRole('button', { name: 'リセットリンクを送信' })).toBeVisible();
  });

  test('認証が必要なページへのアクセス制御', async ({ page }) => {
    // アカウントページにアクセス
    await page.goto('/account');
    
    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.getByText('ログインが必要です')).toBeVisible();
  });
});