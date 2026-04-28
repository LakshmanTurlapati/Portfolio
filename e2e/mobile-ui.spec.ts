import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe('mobile UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('home dock stays at the bottom and does not cover top controls', async ({ page }) => {
    await page.goto('/');

    const dock = page.getByTestId('mobile-navbar');
    await expect(dock).toBeVisible();

    const box = await dock.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThan(720);
    expect(box!.x).toBeGreaterThanOrEqual(10);
    expect(box!.width).toBeLessThanOrEqual(370);

    await expect(page.getByTestId('author-name-mobile')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('mobile routes avoid horizontal overflow', async ({ page }) => {
    for (const route of ['/', '/portfolio', '/about', '/chat']) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('mobile portfolio uses the phone gallery instead of desktop controls', async ({ page }) => {
    await page.goto('/portfolio');

    await expect(page.getByRole('heading', { name: 'Portfolio' })).toBeVisible();
    await expect(page.getByTitle('Grid controls (H)')).toHaveCount(0);
    await expect(page.getByText('Review Gate', { exact: true }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('mobile chat keeps suggestions and input inside the viewport', async ({ page }) => {
    await page.goto('/chat');

    await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible();
    await expect(page.getByPlaceholder('Talk to my persona!')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /Who are you\?|Your age\?|Where from\?/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
