import { expect, test, type Locator, type Page } from '@playwright/test';

type RecordedAnimation = {
  keyframes: Record<string, unknown>;
  options: { delay?: number; duration?: number; fill?: string; pseudoElement?: string | null };
  targetDataset?: Record<string, string | undefined>;
  targetText?: string;
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
      const target = this as HTMLElement;
      window.__portfolioTransitionAnimations.push({
        keyframes: JSON.parse(JSON.stringify(keyframes)),
        options: {
          delay: typeof animationOptions?.delay === 'number' ? animationOptions.delay : undefined,
          duration: typeof animationOptions?.duration === 'number' ? animationOptions.duration : undefined,
          fill: typeof animationOptions?.fill === 'string' ? animationOptions.fill : undefined,
          pseudoElement: animationOptions?.pseudoElement,
        },
        targetDataset: { ...target.dataset },
        targetText: target.textContent ?? undefined,
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

async function expectMobileHomeRouteShell(page: Page) {
  await expect(page.getByTestId('mobile-home-route-shell')).toBeAttached();
  await expect(page.getByTestId('mobile-home-continuity-layer')).toHaveAttribute('data-route', 'home');

  const metrics = await page.evaluate(() => ({
    bodyHeight: document.body.getBoundingClientRect().height,
    viewportHeight: window.innerHeight,
  }));
  expect(metrics.bodyHeight).toBeGreaterThanOrEqual(metrics.viewportHeight - 1);
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
          return (
            animation.options.fill === 'both' &&
            start.includes('circle(0px') &&
            !end.includes('circle(0px')
          );
        });
      }),
    )
    .toBe(true);
}

async function expectRootCollapseAnimation(
  page: Page,
  expectedOrigin?: { x: number; y: number },
) {
  await expect
    .poll(async () =>
      page.evaluate((origin) => {
        const extractOrigin = (value: unknown) => {
          if (typeof value !== 'string') return null;
          const match = value.match(/at ([\d.]+)px ([\d.]+)px/);
          if (!match) return null;
          return { x: Number(match[1]), y: Number(match[2]) };
        };

        return (window.__portfolioTransitionAnimations ?? []).some((animation) => {
          const clipPath = animation.keyframes.clipPath;
          if (animation.options.pseudoElement !== '::view-transition-old(root)' || !Array.isArray(clipPath)) {
            return false;
          }

          const [start, end] = clipPath;
          const collapseOrigin = extractOrigin(end);
          const originMatches =
            !origin ||
            (collapseOrigin &&
              Math.abs(collapseOrigin.x - origin.x) <= 1 &&
              Math.abs(collapseOrigin.y - origin.y) <= 1);

          return (
            animation.options.fill === 'both' &&
            !String(start).includes('circle(0px') &&
            String(end).includes('circle(0px') &&
            originMatches
          );
        });
      }, expectedOrigin),
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

async function expectNoRootScaleAnimation(page: Page) {
  expect(
    await page.evaluate(() =>
      (window.__portfolioTransitionAnimations ?? []).some((animation) => {
        if (!animation.options.pseudoElement?.startsWith('::view-transition-')) return false;
        return /scale(?:3d|X|Y)?\(/i.test(JSON.stringify(animation.keyframes));
      }),
    ),
  ).toBe(false);
}

async function expectResolvedTheme(page: Page, colorScheme: 'light' | 'dark') {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(colorScheme === 'dark');
}

async function readButtonColors(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
    };
  });
}

async function readLocatorCenter(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return {
    x: box!.x + box!.width / 2,
    y: box!.y + box!.height / 2,
  };
}

async function readLocatorRect(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return {
    left: box!.x,
    top: box!.y,
    width: box!.width,
    height: box!.height,
  };
}

async function expectCloseControlMorph(
  page: Page,
  control: 'portfolio' | 'about',
  fromRect: { left: number; top: number; width: number; height: number },
  toRect: { left: number; top: number; width: number; height: number },
) {
  await expect
    .poll(async () =>
      page.evaluate(
        ({ controlName, from, to }) => {
          const px = (value: unknown) => Number.parseFloat(String(value));
          const near = (a: unknown, b: number) => Math.abs(px(a) - b) <= 1;
          const hasReverseRect = (window.__portfolioTransitionAnimations ?? []).some((animation) => {
            if (
              animation.targetDataset?.navControlMorphOverlay !== 'true' ||
              animation.targetDataset.navControlMorphControl !== controlName ||
              animation.targetDataset.navControlMorphDirection !== 'close' ||
              !Array.isArray(animation.keyframes)
            ) {
              return false;
            }

            const [start, end] = animation.keyframes;
            const geometryMatches =
              near(start.left, from.left) &&
              near(start.top, from.top) &&
              near(start.width, from.width) &&
              near(start.height, from.height) &&
              near(end.left, to.left) &&
              near(end.top, to.top) &&
              near(end.width, to.width) &&
              near(end.height, to.height);
            const shadowMatches =
              controlName === 'portfolio'
                ? String(start.boxShadow).includes('rgba(0,43,255') &&
                  String(end.boxShadow).includes('rgba(0,43,255')
                : String(start.boxShadow).includes('rgba(0,0,0,0.18');

            return geometryMatches && shadowMatches;
          });

          const hasReverseLabel = (window.__portfolioTransitionAnimations ?? []).some((animation) => {
            const opacity = !Array.isArray(animation.keyframes) ? animation.keyframes.opacity : undefined;
            return (
              animation.targetDataset?.navControlMorphPart === 'label' &&
              animation.targetDataset.navControlMorphControl === controlName &&
              animation.targetDataset.navControlMorphDirection === 'close' &&
              Array.isArray(opacity) &&
              opacity[0] === 0 &&
              opacity[1] === 1 &&
              animation.options.delay === 110
            );
          });

          const hasReverseArrow = (window.__portfolioTransitionAnimations ?? []).some((animation) => {
            const opacity = !Array.isArray(animation.keyframes) ? animation.keyframes.opacity : undefined;
            return (
              animation.targetDataset?.navControlMorphPart === 'arrow' &&
              animation.targetDataset.navControlMorphControl === controlName &&
              animation.targetDataset.navControlMorphDirection === 'close' &&
              Array.isArray(opacity) &&
              opacity[0] === 1 &&
              opacity[1] === 0 &&
              (animation.options.delay ?? 0) === 0
            );
          });

          return hasReverseRect && hasReverseLabel && hasReverseArrow;
        },
        { controlName: control, from: fromRect, to: toRect },
      ),
    )
    .toBe(true);
}

test('desktop portfolio back button matches the home portfolio button theme colors', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await expectResolvedTheme(page, colorScheme);

    const portfolioButton = page.getByRole('button', { name: 'Portfolio' });
    await expect(portfolioButton).toBeVisible();
    const portfolioColors = await readButtonColors(portfolioButton);

    await page.goto('/portfolio');
    await expectResolvedTheme(page, colorScheme);

    const backButton = page.locator('[data-portfolio-morph-target="true"]');
    await expect(backButton).toBeVisible();
    await expect.poll(() => readButtonColors(backButton)).toEqual(portfolioColors);
  }
});

test('portfolio overlay morph pairs expand reveal with reverse collapse', async ({ page }) => {
  await installAnimationRecorder(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const hasViewTransition = await page.evaluate(() => 'startViewTransition' in document);
  test.skip(!hasViewTransition, 'View Transitions API is required for the root reveal assertion.');

  const portfolioSource = page.locator('[data-portfolio-morph-source="true"]');
  const portfolioOrigin = await readLocatorCenter(page.getByRole('button', { name: 'Portfolio' }));
  const portfolioSourceRect = await readLocatorRect(portfolioSource);

  await clearAnimationRecorder(page);
  await page.getByRole('button', { name: 'Portfolio' }).click();
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toBeAttached();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expectRootExpandAnimation(page);
  await expectNoOldRootCollapse(page);
  await expectNoRootScaleAnimation(page);
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toHaveCount(0);

  await clearAnimationRecorder(page);
  const portfolioBackRect = await readLocatorRect(page.locator('[data-portfolio-morph-target="true"]'));
  await page.locator('[data-portfolio-morph-target="true"]').click();
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toBeAttached();
  await expect(page).toHaveURL(/\/$/);
  await expectCloseControlMorph(page, 'portfolio', portfolioBackRect, portfolioSourceRect);
  await expectRootCollapseAnimation(page, portfolioOrigin);
  await expectNoRootScaleAnimation(page);
  await expect(page.locator('[data-portfolio-morph-overlay="true"]')).toHaveCount(0);
});

test('about and home navigation use the circular reveal without root scale', async ({ page }) => {
  await installAnimationRecorder(page);
  await page.goto('/');

  const hasViewTransition = await page.evaluate(() => 'startViewTransition' in document);
  test.skip(!hasViewTransition, 'View Transitions API is required for the root reveal assertion.');

  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    if (viewport.width < 600) await expectMobileHomeRouteShell(page);

    await clearAnimationRecorder(page);
    const aboutButton = page.getByRole('button', { name: 'About Me' });
    const aboutOrigin = await readLocatorCenter(aboutButton);
    const aboutSourceRect = await readLocatorRect(aboutButton);
    await aboutButton.click();
    if (viewport.width >= 600) {
      await expect(page.locator('[data-about-morph-overlay="true"]')).toBeAttached();
    } else {
      await expect(page.locator('[data-about-morph-overlay="true"]')).toHaveCount(0);
    }
    await expect(page).toHaveURL(/\/about$/);
    await expectRootExpandAnimation(page);
    await expectNoOldRootCollapse(page);
    await expectNoRootScaleAnimation(page);
    if (viewport.width >= 600) {
      await expect(page.locator('[data-about-morph-overlay="true"]')).toHaveCount(0);
    }

    await clearAnimationRecorder(page);
    const aboutBackButton = page.getByRole('button', { name: 'Back to home' }).first();
    const aboutBackRect = await readLocatorRect(aboutBackButton);
    await aboutBackButton.click();
    if (viewport.width >= 600) {
      await expect(page.locator('[data-about-morph-overlay="true"]')).toBeAttached();
    }
    await expect(page).toHaveURL(/\/$/);
    if (viewport.width >= 600) {
      await expectCloseControlMorph(page, 'about', aboutBackRect, aboutSourceRect);
      await expectRootCollapseAnimation(page, aboutOrigin);
    } else {
      await expectRootExpandAnimation(page);
      await expectNoOldRootCollapse(page);
    }
    await expectNoRootScaleAnimation(page);
    await expect(page.locator('[data-about-morph-overlay="true"]')).toHaveCount(0);

    if (viewport.width < 600) await expectMobileHomeRouteShell(page);
  }
});

test('about circular reveal avoids root scale under zoom stress', async ({ page }) => {
  await installAnimationRecorder(page);
  await page.setViewportSize({ width: 1024, height: 720 });
  await page.goto('/');

  const hasViewTransition = await page.evaluate(() => 'startViewTransition' in document);
  test.skip(!hasViewTransition, 'View Transitions API is required for the root reveal assertion.');

  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.25 });

  await clearAnimationRecorder(page);
  await page.getByRole('button', { name: 'About Me' }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expectRootExpandAnimation(page);
  await expectNoOldRootCollapse(page);
  await expectNoRootScaleAnimation(page);

  await session.detach();
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
  await expectNoRootScaleAnimation(page);
});

test('desktop portfolio grid does not fade the first row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/portfolio');

  const grid = page.getByTestId('portfolio-grid');
  await expect(grid).toBeVisible();

  const mask = await grid.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      maskImage: style.maskImage,
      webkitMaskImage: style.getPropertyValue('-webkit-mask-image'),
    };
  });

  expect(['', 'none']).toContain(mask.maskImage);
  expect(['', 'none']).toContain(mask.webkitMaskImage);
});
