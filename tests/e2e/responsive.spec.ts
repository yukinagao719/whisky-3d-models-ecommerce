import { test, expect } from '@playwright/test';

test.describe('レスポンシブ対応', () => {
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto('/');
      });

      test('ヘッダーナビゲーションの表示', async ({ page }) => {
        const header = page.locator('header');
        await expect(header).toBeVisible();

        // ロゴの確認
        await expect(page.getByText('3D/WHISKY')).toBeVisible();

        if (viewport.width >= 768) {
          // デスクトップ・タブレット: メニューが直接表示
          await expect(
            page.getByRole('link', { name: 'ホーム' })
          ).toBeVisible();
          await expect(
            page.getByRole('link', { name: '商品一覧' })
          ).toBeVisible();
          await expect(
            page.getByRole('button', { name: 'ログイン' })
          ).toBeVisible();
        } else {
          // モバイル: ハンバーガーメニューボタンが表示
          const menuButton = page.getByRole('button', { name: 'メニュー' });
          await expect(menuButton).toBeVisible();

          // メニューを開く
          await menuButton.click();
          await expect(
            page.getByRole('link', { name: 'ホーム' })
          ).toBeVisible();
          await expect(
            page.getByRole('link', { name: '商品一覧' })
          ).toBeVisible();
        }
      });

      test('フッターの表示', async ({ page }) => {
        // ページ下部までスクロール
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        // フッターコンテンツの確認
        await expect(page.getByText('© 2024 3D/WHISKY')).toBeVisible();

        if (viewport.width >= 768) {
          // デスクトップ・タブレット: フッターリンクが横並び
          await expect(
            page.getByRole('link', { name: 'プライバシーポリシー' })
          ).toBeVisible();
          await expect(
            page.getByRole('link', { name: '利用規約' })
          ).toBeVisible();
        }
      });

      test('商品一覧ページのレイアウト', async ({ page }) => {
        await page.goto('/products');

        const productGrid = page.locator('[data-testid="product-grid"]');
        await expect(productGrid).toBeVisible();

        // 商品カードの表示確認
        const productCards = page.locator('[data-testid="product-card"]');
        await expect(productCards.first()).toBeVisible();

        // グリッドレイアウトの確認
        if (viewport.width >= 1024) {
          // デスクトップ: 3-4列
          const firstRowCards = productCards
            .first()
            .locator('xpath=following-sibling::*[position()<3]');
          await expect(firstRowCards).toHaveCount(2, { timeout: 5000 });
        } else if (viewport.width >= 768) {
          // タブレット: 2列
          const gridColumns = await page.evaluate(() => {
            const grid = document.querySelector('[data-testid="product-grid"]');
            return grid
              ? window.getComputedStyle(grid).gridTemplateColumns
              : '';
          });
          expect(gridColumns).toContain('1fr 1fr');
        } else {
          // モバイル: 1列
          const gridColumns = await page.evaluate(() => {
            const grid = document.querySelector('[data-testid="product-grid"]');
            return grid
              ? window.getComputedStyle(grid).gridTemplateColumns
              : '';
          });
          expect(gridColumns).toContain('1fr');
        }
      });

      test('商品詳細ページのレイアウト', async ({ page }) => {
        await page.goto('/products');
        await page
          .locator('[data-testid="product-card"]')
          .first()
          .getByRole('button', { name: '詳細を見る' })
          .click();

        // 3Dモデルビューワーの確認
        const modelViewer = page.locator('[data-testid="model-viewer"]');
        await expect(modelViewer).toBeVisible();

        // 商品情報の確認
        const productInfo = page.locator('[data-testid="product-info"]');
        await expect(productInfo).toBeVisible();

        if (viewport.width >= 768) {
          // デスクトップ・タブレット: 横並びレイアウト
          const productLayout = page.locator('[data-testid="product-layout"]');
          const layoutStyle = await productLayout.evaluate(
            (el) => window.getComputedStyle(el).display
          );
          expect(['flex', 'grid']).toContain(layoutStyle);
        } else {
          // モバイル: 縦並びレイアウト
          const modelViewerBox = await modelViewer.boundingBox();
          const productInfoBox = await productInfo.boundingBox();

          if (modelViewerBox && productInfoBox) {
            // モバイルでは3Dビューワーが上、商品情報が下に配置される
            expect(modelViewerBox.y).toBeLessThan(productInfoBox.y);
          }
        }
      });

      test('カートページのレスポンシブ表示', async ({ page }) => {
        // 商品をカートに追加
        await page.goto('/products');
        await page
          .locator('[data-testid="product-card"]')
          .first()
          .getByRole('button', { name: '詳細を見る' })
          .click();
        await page.getByRole('button', { name: 'カートに追加' }).click();

        // カートページに移動
        await page.getByRole('link', { name: 'カート' }).click();

        // カートアイテムの表示確認
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        await expect(cartItem).toBeVisible();

        // 数量コントロールの表示
        await expect(cartItem.getByRole('button', { name: '+' })).toBeVisible();
        await expect(cartItem.getByRole('button', { name: '-' })).toBeVisible();

        if (viewport.width < 768) {
          // モバイルでは要素が縦に配置される
          const itemImage = cartItem.locator('img');
          const itemDetails = cartItem.locator('[data-testid="item-details"]');

          if (
            (await itemImage.isVisible()) &&
            (await itemDetails.isVisible())
          ) {
            const imageBox = await itemImage.boundingBox();
            const detailsBox = await itemDetails.boundingBox();

            if (imageBox && detailsBox) {
              expect(imageBox.y).toBeLessThanOrEqual(detailsBox.y);
            }
          }
        }
      });

      test('モーダルのレスポンシブ表示', async ({ page }) => {
        // ログインモーダルを開く
        await page.getByRole('button', { name: 'ログイン' }).click();

        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();

        // モーダルのサイズ確認
        const modalBox = await modal.boundingBox();
        expect(modalBox).toBeTruthy();

        if (modalBox) {
          if (viewport.width < 768) {
            // モバイル: モーダルが画面幅いっぱいに近い
            expect(modalBox.width).toBeGreaterThan(viewport.width * 0.8);
          } else {
            // デスクトップ・タブレット: 固定サイズのモーダル
            expect(modalBox.width).toBeLessThan(viewport.width * 0.8);
          }
        }

        // フォーム要素の表示確認
        await expect(page.getByLabel('メールアドレス')).toBeVisible();
        await expect(page.getByLabel('パスワード')).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'ログイン' })
        ).toBeVisible();
      });

      test('3Dモデルビューワーのタッチ操作（モバイル）', async ({ page }) => {
        if (viewport.width >= 768) {
          test.skip();
        }

        await page.goto('/products');
        await page
          .locator('[data-testid="product-card"]')
          .first()
          .getByRole('button', { name: '詳細を見る' })
          .click();

        const canvas = page.locator('[data-testid="model-viewer"] canvas');
        await canvas.waitFor({ state: 'visible' });

        // モデルロード完了を待機
        await page.waitForTimeout(3000);

        // タッチ操作のシミュレーション
        const canvasBox = await canvas.boundingBox();
        if (canvasBox) {
          const centerX = canvasBox.x + canvasBox.width / 2;
          const centerY = canvasBox.y + canvasBox.height / 2;

          // タッチとドラッグでモデルを回転
          await page.touchscreen.tap(centerX, centerY);
          await page.touchscreen.tap(centerX + 50, centerY);

          // 操作後もcanvasが表示されていることを確認
          await expect(canvas).toBeVisible();
        }
      });

      test('フォントサイズとコントラストの確認', async ({ page }) => {
        await page.goto('/products');

        // メインテキストのフォントサイズ確認
        const productTitle = page
          .locator('[data-testid="product-card"] h3')
          .first();
        const fontSize = await productTitle.evaluate(
          (el) => window.getComputedStyle(el).fontSize
        );
        const fontSizeNumber = parseInt(fontSize);

        if (viewport.width < 768) {
          // モバイル: 最小フォントサイズを確保
          expect(fontSizeNumber).toBeGreaterThanOrEqual(14);
        } else {
          // デスクトップ: 適切なフォントサイズ
          expect(fontSizeNumber).toBeGreaterThanOrEqual(16);
        }

        // ボタンのタッチターゲットサイズ確認（モバイル）
        if (viewport.width < 768) {
          const button = page
            .getByRole('button', { name: '詳細を見る' })
            .first();
          const buttonBox = await button.boundingBox();

          if (buttonBox) {
            // 最小タッチターゲットサイズ（44px推奨）
            expect(buttonBox.height).toBeGreaterThanOrEqual(40);
          }
        }
      });

      test('スクロール動作の確認', async ({ page }) => {
        await page.goto('/products');

        // ページが長い場合のスクロール確認
        const initialScrollY = await page.evaluate(() => window.scrollY);

        // ページ下部までスクロール
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        await page.waitForTimeout(500);

        const finalScrollY = await page.evaluate(() => window.scrollY);
        expect(finalScrollY).toBeGreaterThan(initialScrollY);

        // スクロール後もヘッダーが見える（固定ヘッダーの場合）
        const header = page.locator('header');
        await expect(header).toBeVisible();
      });
    });
  }

  test('画面回転時の動作確認（モバイル）', async ({ page }) => {
    // 縦向き
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');

    await page
      .locator('[data-testid="product-card"]')
      .first()
      .getByRole('button', { name: '詳細を見る' })
      .click();

    const modelViewer = page.locator('[data-testid="model-viewer"]');
    await expect(modelViewer).toBeVisible();

    // 横向きに回転
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    // 3Dビューワーが横向きでも正常に表示されることを確認
    await expect(modelViewer).toBeVisible();

    const canvas = modelViewer.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
