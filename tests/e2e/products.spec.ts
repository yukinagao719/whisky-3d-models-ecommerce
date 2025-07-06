import { test, expect } from '@playwright/test';

test.describe('商品閲覧・3Dモデル表示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('商品一覧ページの表示確認', async ({ page }) => {
    // 商品一覧ページに移動
    await page.getByRole('link', { name: '商品一覧' }).click();
    await expect(page).toHaveURL('/products');

    // ページタイトルの確認
    await expect(page.getByRole('heading', { name: '商品一覧' })).toBeVisible();

    // 商品カードの表示確認
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();

    // 商品情報の確認
    await expect(productCards.first().getByRole('heading')).toBeVisible();
    await expect(productCards.first().getByText('¥')).toBeVisible();
    await expect(productCards.first().getByRole('button', { name: '詳細を見る' })).toBeVisible();
  });

  test('商品詳細ページの表示確認', async ({ page }) => {
    await page.goto('/products');
    
    // 最初の商品をクリック
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    
    // 商品詳細ページの基本要素を確認
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByText('¥')).toBeVisible();
    
    // 商品説明の確認
    await expect(page.getByText('商品説明')).toBeVisible();
    
    // カートボタンの確認
    await expect(page.getByRole('button', { name: 'カートに追加' })).toBeVisible();
  });

  test('3Dモデルビューワーの表示確認', async ({ page }) => {
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    
    // 3Dモデルビューワーコンテナの確認
    const modelViewer = page.locator('[data-testid="model-viewer"]');
    await expect(modelViewer).toBeVisible();
    
    // Canvas要素の確認
    const canvas = modelViewer.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // ローディング状態の確認（初期表示時）
    await expect(page.getByText('モデルを読み込み中...')).toBeVisible({ timeout: 1000 });
    
    // モデルロード完了の確認（最大10秒待機）
    await expect(page.getByText('モデルを読み込み中...')).not.toBeVisible({ timeout: 10000 });
  });

  test('3Dモデルの操作確認', async ({ page }) => {
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    
    const canvas = page.locator('[data-testid="model-viewer"] canvas');
    await canvas.waitFor({ state: 'visible' });
    
    // モデルロード完了を待機
    await page.waitForTimeout(3000);
    
    // マウス操作（回転）のテスト
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;
      
      // ドラッグ操作でモデルを回転
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 50, centerY);
      await page.mouse.up();
      
      // 操作後もcanvasが表示されていることを確認
      await expect(canvas).toBeVisible();
    }
  });

  test('3Dモデルコントロールボタンの確認', async ({ page }) => {
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    
    // リセットボタンの確認
    const resetButton = page.getByRole('button', { name: 'リセット' });
    await expect(resetButton).toBeVisible();
    
    // リセットボタンの動作確認
    await resetButton.click();
    await expect(page.locator('[data-testid="model-viewer"] canvas')).toBeVisible();
  });

  test('商品画像ギャラリーの確認', async ({ page }) => {
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    
    // 商品画像の確認
    const productImages = page.locator('[data-testid="product-images"]');
    await expect(productImages).toBeVisible();
    
    // メイン画像の確認
    const mainImage = productImages.locator('img').first();
    await expect(mainImage).toBeVisible();
    await expect(mainImage).toHaveAttribute('alt');
  });

  test('商品フィルター機能の確認', async ({ page }) => {
    await page.goto('/products');
    
    // フィルターセクションの確認
    const filterSection = page.locator('[data-testid="product-filters"]');
    await expect(filterSection).toBeVisible();
    
    // カテゴリフィルターの確認
    const categoryFilter = filterSection.locator('[data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      // フィルター適用後も商品が表示されることを確認
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    }
  });

  test('商品検索機能の確認', async ({ page }) => {
    await page.goto('/products');
    
    // 検索ボックスの確認
    const searchBox = page.locator('[data-testid="product-search"]');
    if (await searchBox.isVisible()) {
      await searchBox.fill('whiskey');
      await page.keyboard.press('Enter');
      
      // 検索結果の確認
      await expect(page.locator('[data-testid="product-card"]')).toBeVisible();
    }
  });

  test('商品詳細ページのレスポンシブ表示', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    
    // モバイルでの3Dビューワー表示確認
    const modelViewer = page.locator('[data-testid="model-viewer"]');
    await expect(modelViewer).toBeVisible();
    
    // モバイルでのレイアウト確認
    const productInfo = page.locator('[data-testid="product-info"]');
    await expect(productInfo).toBeVisible();
  });

  test('3Dモデルエラーハンドリングの確認', async ({ page }) => {
    // 存在しない商品IDでアクセス
    await page.goto('/products/non-existent-id');
    
    // エラーページまたはエラーメッセージの確認
    const errorMessage = page.getByText('商品が見つかりません');
    const notFoundMessage = page.getByText('404');
    
    await expect(errorMessage.or(notFoundMessage)).toBeVisible();
  });
});