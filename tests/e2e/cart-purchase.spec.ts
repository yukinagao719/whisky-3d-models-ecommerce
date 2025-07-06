import { test, expect } from '@playwright/test';

test.describe('カート・購入フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('カートへの商品追加', async ({ page }) => {
    // 商品詳細ページに移動
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    
    // カートに追加ボタンをクリック
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // カートアイコンのバッジ確認
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText('1');
    
    // 成功メッセージの確認
    await expect(page.getByText('商品をカートに追加しました')).toBeVisible();
  });

  test('カートページの表示確認', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // カートページに移動
    await page.getByRole('link', { name: 'カート' }).click();
    await expect(page).toHaveURL('/cart');
    
    // カート内容の確認
    await expect(page.getByRole('heading', { name: 'ショッピングカート' })).toBeVisible();
    
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(1);
    
    // 商品情報の確認
    await expect(cartItems.first().getByRole('heading')).toBeVisible();
    await expect(cartItems.first().getByText('¥')).toBeVisible();
    
    // 数量コントロールの確認
    await expect(cartItems.first().getByRole('button', { name: '-' })).toBeVisible();
    await expect(cartItems.first().getByRole('button', { name: '+' })).toBeVisible();
    await expect(cartItems.first().locator('input[type="number"]')).toBeVisible();
    
    // 削除ボタンの確認
    await expect(cartItems.first().getByRole('button', { name: '削除' })).toBeVisible();
  });

  test('カート内商品の数量変更', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // カートページに移動
    await page.getByRole('link', { name: 'カート' }).click();
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    
    // 数量を増加
    await cartItem.getByRole('button', { name: '+' }).click();
    
    // 数量が更新されることを確認
    const quantityInput = cartItem.locator('input[type="number"]');
    await expect(quantityInput).toHaveValue('2');
    
    // 小計が更新されることを確認
    await expect(page.getByText('小計')).toBeVisible();
    
    // 数量を減少
    await cartItem.getByRole('button', { name: '-' }).click();
    await expect(quantityInput).toHaveValue('1');
  });

  test('カートから商品削除', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // カートページに移動
    await page.getByRole('link', { name: 'カート' }).click();
    
    // 商品を削除
    await page.locator('[data-testid="cart-item"]').first().getByRole('button', { name: '削除' }).click();
    
    // 確認ダイアログがある場合は確認
    const confirmButton = page.getByRole('button', { name: '削除する' });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // カートが空になることを確認
    await expect(page.getByText('カートに商品がありません')).toBeVisible();
    await expect(page.getByRole('link', { name: '商品一覧に戻る' })).toBeVisible();
  });

  test('購入手続きページへの遷移', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // カートページに移動
    await page.getByRole('link', { name: 'カート' }).click();
    
    // 購入手続きボタンをクリック
    await page.getByRole('button', { name: '購入手続きに進む' }).click();
    
    // ログインしていない場合はログインページに遷移
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/signin')) {
      await expect(page.getByText('購入にはログインが必要です')).toBeVisible();
    } else {
      // ログイン済みの場合は購入ページに遷移
      await expect(page).toHaveURL('/checkout');
    }
  });

  test('ゲスト購入フローの確認', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // カートページに移動
    await page.getByRole('link', { name: 'カート' }).click();
    
    // ゲスト購入ボタンをクリック
    const guestCheckoutButton = page.getByRole('button', { name: 'ゲストとして購入' });
    if (await guestCheckoutButton.isVisible()) {
      await guestCheckoutButton.click();
      
      // ゲスト情報入力フォームの確認
      await expect(page.getByLabel('お名前')).toBeVisible();
      await expect(page.getByLabel('メールアドレス')).toBeVisible();
      await expect(page.getByLabel('電話番号')).toBeVisible();
    }
  });

  test('購入確認ページの表示', async ({ page }) => {
    // 商品をカートに追加してチェックアウトページまで進む
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // 直接チェックアウトページにアクセス（認証状態に応じて）
    await page.goto('/checkout');
    
    // ページが表示されるかログインページにリダイレクトされるかを確認
    const isCheckoutPage = await page.locator('[data-testid="checkout-form"]').isVisible({ timeout: 3000 });
    
    if (isCheckoutPage) {
      // 注文確認セクションの確認
      await expect(page.getByText('注文確認')).toBeVisible();
      await expect(page.getByText('合計金額')).toBeVisible();
      
      // 支払い方法選択の確認
      await expect(page.getByText('支払い方法')).toBeVisible();
      
      // Stripe決済ボタンの確認
      await expect(page.getByRole('button', { name: '決済に進む' })).toBeVisible();
    } else {
      // ログインページにリダイレクトされた場合
      await expect(page).toHaveURL(/\/auth\/signin/);
    }
  });

  test('カートの永続化確認', async ({ page }) => {
    // 商品をカートに追加
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // ページをリロード
    await page.reload();
    
    // カートアイコンのバッジが残っていることを確認
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText('1');
    
    // カートページで商品が保持されていることを確認
    await page.getByRole('link', { name: 'カート' }).click();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('複数商品のカート操作', async ({ page }) => {
    await page.goto('/products');
    
    // 複数の商品をカートに追加
    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = Math.min(2, await productCards.count());
    
    for (let i = 0; i < productCount; i++) {
      await productCards.nth(i).getByRole('button', { name: '詳細を見る' }).click();
      await page.getByRole('button', { name: 'カートに追加' }).click();
      
      // 商品一覧に戻る
      await page.goBack();
    }
    
    // カートページで複数商品を確認
    await page.getByRole('link', { name: 'カート' }).click();
    
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(productCount);
    
    // 合計金額の確認
    await expect(page.getByText('合計')).toBeVisible();
  });

  test('カートのレスポンシブ表示', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 商品をカートに追加
    await page.goto('/products');
    await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: '詳細を見る' }).click();
    await page.getByRole('button', { name: 'カートに追加' }).click();
    
    // カートページの表示確認
    await page.getByRole('link', { name: 'カート' }).click();
    
    // モバイルでのレイアウト確認
    await expect(page.getByRole('heading', { name: 'ショッピングカート' })).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    
    // モバイルでの操作確認
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem.getByRole('button', { name: '+' })).toBeVisible();
    await expect(cartItem.getByRole('button', { name: '-' })).toBeVisible();
  });
});