import { expect, test, type Page } from '@playwright/test';

type RecordedAnimation = {
  keyframes: { clipPath?: string[] };
  options: { pseudoElement?: string };
};

declare global {
  interface Window {
    __portfolioTransitionAnimations?: RecordedAnimation[];
  }
}

async function installAnimationRecorder(page: Page) {
  await page.addInitScript(() => {
    const originalAnimate = Element.prototype.animate;

    Element.prototype.animate = function patchedAnimate(keyframes, options) {
      const animationOptions = options as KeyframeAnimationOptions | undefined;
      window.__portfolioTransitionAnimations ??= [];
      window.__portfolioTransitionAnimations.push({
        keyframes: JSON.parse(JSON.stringify(keyframes)),
        options: {
          pseudoElement: animationOptions?.pseudoElement,
        },
      });

      return originalAnimate.call(this, keyframes, options);
    };
  });
}

async function clearAnimationRecorder(page: Page) {
  await page.evaluate(() => {
    window.__portfolioTransitionAnimations = [];
  });
}

async function expectRootExpandAnimation(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => {
        return (window.__portfolioTransitionAnimations ?? []).some((animation) => {
          const clipPath = animation.keyframes.clipPath;
          if (animation.options.pseudoElement !== '::view-transition-new(root)' || !Array.isArray(clipPath)) {
            return false;
          }

          const [start, end] = clipPath;
          return start.includes('circle(0px') && !end.includes('circle(0px');
        });
      }),
    )
    .toBe(true);
}

async function expectNoOldRootCollapse(page: Page) {
  expect(
    await page.evaluate(() =>
      (window.__portfolioTransitionAnimations ?? []).some((animation) => {
        const clipPath = animation.keyframes.clipPath;
        return (
          animation.options.pseudoElement === '::view-transition-old(root)' &&
          Array.isArray(clipPath) &&
          !clipPath[0].includes('circle(0px') &&
          clipPath[1].includes('circle(0px')
        );
      }),
    ),
  ).toBe(false);
}

test('portfolio overlay morph preserves the original circular reveal', async ({ page }) => {
  await installAnimationRecorder(page);
  await page.goto('/');

  const hasViewTransition = await page.evaluate(() => 'startViewTransition' in document);
  test.skip(!hasViewTransition, 'View Transitions API is required for the root reveal assertion.');

  await clearAnimationRecorder(page);
  await page.getByRole('button', { name: 'Portfolio' }).click();
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toBeAttached();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expectRootExpandAnimation(page);
  await expectNoOldRootCollapse(page);
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toHaveCount(0);

  await clearAnimationRecorder(page);
  await page.locator('[data-portfolio-morph-target="true"]').click();
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toBeAttached();
  await expect(page).toHaveURL(/\/$/);
  await expectRootExpandAnimation(page);
  await expectNoOldRootCollapse(page);
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toHaveCount(0);
});

test('mobile portfolio navigation keeps the reveal without the overlay morph', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAnimationRecorder(page);
  await page.goto('/');

  const hasViewTransition = await page.evaluate(() => 'startViewTransition' in document);
  test.skip(!hasViewTransition, 'View Transitions API is required for the root reveal assertion.');

  await clearAnimationRecorder(page);
  await page.getByRole('button', { name: 'Portfolio' }).click();
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toHaveCount(0);
  await expect(page).toHaveURL(/\/portfolio$/);
  await expectRootExpandAnimation(page);
});
