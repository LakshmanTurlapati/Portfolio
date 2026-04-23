import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectMobileHomeRightGutter(page: import('@playwright/test').Page, minimum = 24) {
  const roller = page.getByTestId('mobile-home-role-roller');
  await expect(roller).toBeVisible();

  const box = await roller.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(viewport!.width - (box!.x + box!.width)).toBeGreaterThanOrEqual(minimum - 1);
}

async function expectMobileSocialIconSize(page: import('@playwright/test').Page, minimum = 16) {
  const dock = page.getByTestId('mobile-navbar');
  for (const label of ['GitHub profile', 'LinkedIn profile', 'X (Twitter) profile']) {
    const size = await dock.getByLabel(label).locator('svg').evaluate((element) => {
      return Number.parseFloat(window.getComputedStyle(element).fontSize);
    });
    expect(size).toBeGreaterThanOrEqual(minimum);
  }
}

async function expectFullScreenVoiceStage(page: import('@playwright/test').Page) {
  const stage = page.getByTestId('mobile-parz-voice-stage');
  const box = await stage.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeLessThanOrEqual(1);
  expect(box!.y).toBeLessThanOrEqual(1);
  expect(box!.width).toBeGreaterThanOrEqual(viewport!.width - 1);
  expect(box!.height).toBeGreaterThanOrEqual(viewport!.height - 1);
  await expect(stage).toHaveCSS('border-radius', '0px');
}

async function expectMediumLargeVoiceScale(page: import('@playwright/test').Page) {
  const wave = page.getByTestId('mobile-parz-wave');
  await expect(wave).toBeVisible();
  const waveBox = await wave.boundingBox();
  expect(waveBox).not.toBeNull();
  expect(waveBox!.width).toBeGreaterThanOrEqual(156);
  expect(waveBox!.width).toBeLessThanOrEqual(195);
  expect(waveBox!.height).toBeGreaterThanOrEqual(72);
  expect(waveBox!.height).toBeLessThanOrEqual(96);

  const captionSize = await page.getByTestId('mobile-parz-caption').evaluate((element) => {
    return Number.parseFloat(window.getComputedStyle(element).fontSize);
  });
  expect(captionSize).toBeGreaterThanOrEqual(16);
  expect(captionSize).toBeLessThanOrEqual(20.5);
}

async function expectUnifiedMobileChatTheme(
  page: import('@playwright/test').Page,
  expectedBackground: string,
  expectedColor: string,
) {
  await expect(page.getByTestId('mobile-parz-voice-stage')).toHaveCSS('background-color', expectedBackground);
  await expect(page.getByTestId('mobile-parz-voice-stage')).toHaveCSS('color', expectedColor);
  await expect(page.getByTestId('toggle-to-legacy-chat')).toHaveCSS('color', expectedColor);

  await page.getByTestId('toggle-to-legacy-chat').click();

  const chatCard = page.locator('[data-chat-popup-card]');
  await expect(chatCard).toHaveCSS('background-color', expectedBackground);
  await expect(chatCard).toHaveCSS('color', expectedColor);
}

async function expectMobileVoiceControlsAtTop(page: import('@playwright/test').Page) {
  const legacyButton = page.getByTestId('toggle-to-legacy-chat');
  const exitChevron = page.getByTestId('mobile-chat-exit-chevron');
  const legacyBox = await legacyButton.boundingBox();
  const exitBox = await exitChevron.boundingBox();
  const viewport = page.viewportSize();

  expect(legacyBox).not.toBeNull();
  expect(exitBox).not.toBeNull();
  expect(viewport).not.toBeNull();

  expect(legacyBox!.x).toBeGreaterThanOrEqual(16);
  expect(legacyBox!.x).toBeLessThanOrEqual(28);
  expect(legacyBox!.y).toBeGreaterThanOrEqual(16);
  expect(legacyBox!.y).toBeLessThanOrEqual(32);

  expect(exitBox!.x + exitBox!.width).toBeGreaterThanOrEqual(viewport!.width - 28);
  expect(exitBox!.x + exitBox!.width).toBeLessThanOrEqual(viewport!.width - 12);
  expect(exitBox!.y).toBeGreaterThanOrEqual(16);
  expect(exitBox!.y).toBeLessThanOrEqual(32);
  expect(legacyBox!.x + legacyBox!.width).toBeLessThan(exitBox!.x - 12);
}

async function expectCompleteMobileVoicePreview(page: import('@playwright/test').Page) {
  const preview = page.getByTestId('mobile-chat-drag-preview');
  await expect(preview).toBeVisible();
  await expect(preview.getByTestId('mobile-parz-voice-stage')).toBeVisible();
  await expect(preview.getByTestId('toggle-to-legacy-chat')).toHaveText('Legacy chat');
  await expect(preview.getByTestId('mobile-chat-exit-chevron')).toBeVisible();
  await expect(preview.getByTestId('mobile-voice-primary-action')).toBeVisible();
  await expect(preview.getByTestId('mobile-parz-wave')).toBeVisible();
}

async function expectMobileLegacyPromptsCentered(page: import('@playwright/test').Page) {
  const group = page.getByRole('group', { name: 'Suggested questions' });
  await expect(group).toBeVisible();
  await expect(group).toHaveCSS('justify-content', 'center');
  await expect(group).toHaveCSS('flex-wrap', 'wrap');
  await expect(group).toHaveCSS('overflow-x', 'visible');

  const rows = await group.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const center =
      rect.left +
      Number.parseFloat(style.paddingLeft) +
      (rect.width - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)) / 2;
    const rowMetrics: Array<{ top: number; left: number; right: number }> = [];

    for (const chip of Array.from(element.querySelectorAll('[data-chat-chip="true"]'))) {
      const chipRect = chip.getBoundingClientRect();
      const row = rowMetrics.find((candidate) => Math.abs(candidate.top - chipRect.top) < 4);
      if (row) {
        row.left = Math.min(row.left, chipRect.left);
        row.right = Math.max(row.right, chipRect.right);
      } else {
        rowMetrics.push({ top: chipRect.top, left: chipRect.left, right: chipRect.right });
      }
    }

    return rowMetrics.map((row) => Math.abs((row.left + row.right) / 2 - center));
  });

  expect(rows.length).toBeGreaterThan(0);
  for (const offset of rows) expect(offset).toBeLessThanOrEqual(3);
}

async function getExitButtonMetrics(page: import('@playwright/test').Page) {
  const button = page.getByRole('button', { name: 'Exit chat' });
  const buttonBox = await button.boundingBox();
  const iconBox = await button.locator('svg').boundingBox();
  expect(buttonBox).not.toBeNull();
  expect(iconBox).not.toBeNull();
  return {
    buttonWidth: buttonBox!.width,
    buttonHeight: buttonBox!.height,
    iconWidth: iconBox!.width,
    iconHeight: iconBox!.height,
  };
}

async function expectMobileLegacyExitMatchesVoiceSize(
  page: import('@playwright/test').Page,
  voiceMetrics: Awaited<ReturnType<typeof getExitButtonMetrics>>,
) {
  const legacyMetrics = await getExitButtonMetrics(page);
  expect(Math.abs(legacyMetrics.buttonWidth - voiceMetrics.buttonWidth)).toBeLessThanOrEqual(0.75);
  expect(Math.abs(legacyMetrics.buttonHeight - voiceMetrics.buttonHeight)).toBeLessThanOrEqual(0.75);
  expect(Math.abs(legacyMetrics.iconWidth - voiceMetrics.iconWidth)).toBeLessThanOrEqual(0.75);
  expect(Math.abs(legacyMetrics.iconHeight - voiceMetrics.iconHeight)).toBeLessThanOrEqual(0.75);
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
    await expect(dock.locator('[data-parz-btn]')).toHaveCount(0);
    await expect(dock).not.toHaveAttribute('data-chat-morph-origin', 'true');
    await expect(page.locator('button[aria-label="Activate Parz voice mode"]:visible')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open chat' })).toBeVisible();
    await expect(page.getByTestId('mobile-chat-chevron-icon')).toHaveAttribute('data-direction', 'right');

    const chevronAnimation = await page.getByTestId('mobile-chat-chevron-icon').evaluate((element) => {
      const wrapper = element.parentElement;
      const style = window.getComputedStyle(wrapper ?? element);
      return {
        duration: style.animationDuration,
        iterationCount: style.animationIterationCount,
        name: style.animationName,
        timingFunction: style.animationTimingFunction,
      };
    });
    expect(chevronAnimation.name).toBe('arrow-bounce');
    expect(chevronAnimation.duration).toBe('1.8s');
    expect(chevronAnimation.iterationCount).toBe('infinite');
    expect(chevronAnimation.timingFunction).toBe('cubic-bezier(0.22, 1, 0.36, 1)');

    await expectMobileHomeRightGutter(page);
    await expectMobileSocialIconSize(page);
    await expectNoHorizontalOverflow(page);
  });

  test('mobile home keeps a rigid right gutter in light and dark themes', async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });

      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        await page.goto('/');

        await expectMobileHomeRightGutter(page);
        await expectNoHorizontalOverflow(page);
      }
    }
  });

  test('mobile navbar social icons stay comfortably sized on narrow phones', async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');

      await expectMobileSocialIconSize(page);
      await expectNoHorizontalOverflow(page);
    }
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

  test('mobile chevron opens default Parz chat screen', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open chat' }).click();

    await expectCompleteMobileVoicePreview(page);
    await expect(page.getByTestId('mobile-chat-drag-preview')).toBeVisible();
    await expect
      .poll(async () => Number(await page.getByTestId('mobile-chat-drag-preview').getAttribute('data-progress')))
      .toBeGreaterThan(0.9);
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByTestId('mobile-parz-chat')).toBeVisible();
    await expectFullScreenVoiceStage(page);
    await expectMediumLargeVoiceScale(page);
    await expect(page.getByTestId('toggle-to-legacy-chat')).toHaveText('Legacy chat');
    await expectMobileVoiceControlsAtTop(page);
    await expectNoHorizontalOverflow(page);
  });

  test('mobile home scene remains mounted through chat entry and exit', async ({ page }) => {
    await page.goto('/');

    const homeLayer = page.getByTestId('mobile-home-continuity-layer');
    await expect(homeLayer).toHaveAttribute('data-route', 'home');
    await homeLayer.evaluate((element) => {
      (element as HTMLElement & { __continuityMarker?: string }).__continuityMarker = 'same-node';
    });

    await page.getByRole('button', { name: 'Open chat' }).click();
    await expect(page).toHaveURL(/\/chat$/);

    const chatLayer = page.getByTestId('mobile-home-continuity-layer');
    await expect(chatLayer).toHaveAttribute('data-route', 'chat');
    await expect(chatLayer.getByTestId('mobile-home-role-roller')).toBeVisible();
    await expect
      .poll(async () => chatLayer.evaluate((element) => (
        element as HTMLElement & { __continuityMarker?: string }
      ).__continuityMarker))
      .toBe('same-node');

    await page.getByRole('button', { name: 'Exit chat' }).click();
    await expect(page).toHaveURL(/\/$/);

    const returnedLayer = page.getByTestId('mobile-home-continuity-layer');
    await expect(returnedLayer).toHaveAttribute('data-route', 'home');
    await expect
      .poll(async () => returnedLayer.evaluate((element) => (
        element as HTMLElement & { __continuityMarker?: string }
      ).__continuityMarker))
      .toBe('same-node');
  });

  test('mobile chevron partial right drag slides chat preview with the finger and snaps back', async ({ page }) => {
    await page.goto('/');

    const chevron = page.getByRole('button', { name: 'Open chat' });
    const box = await chevron.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 72, box!.y + box!.height / 2, { steps: 4 });

    const draggedChevronAnimation = await page.getByTestId('mobile-chat-chevron-icon').evaluate((element) => {
      return window.getComputedStyle(element.parentElement ?? element).animationName;
    });
    expect(draggedChevronAnimation).toBe('none');

    const preview = page.getByTestId('mobile-chat-drag-preview');
    await expect(preview).toBeVisible();
    const dragState = await preview.evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).transform);
      return {
        progress: Number((element as HTMLElement).dataset.progress),
        translateX: matrix.m41,
      };
    });
    expect(dragState.progress).toBeGreaterThan(0.35);
    expect(dragState.progress).toBeLessThan(0.45);
    expect(dragState.translateX).toBeLessThan(-viewport!.width * 0.5);
    expect(dragState.translateX).toBeGreaterThan(-viewport!.width * 0.7);

    await page.waitForTimeout(350);
    await page.mouse.up();

    await expect(page).toHaveURL(/\/$/);
    await expect(preview).toHaveCount(0);
  });

  test('mobile chevron ignores left drag on the home screen', async ({ page }) => {
    await page.goto('/');

    const chevron = page.getByRole('button', { name: 'Open chat' });
    const box = await chevron.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 - 110, box!.y + box!.height / 2, { steps: 4 });
    await page.mouse.up();

    await expect(page).toHaveURL(/\/$/);
  });

  test('mobile chevron drag opens default Parz chat screen', async ({ page }) => {
    await page.goto('/');

    const chevron = page.getByRole('button', { name: 'Open chat' });
    const box = await chevron.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 110, box!.y + box!.height / 2, { steps: 4 });
    await page.mouse.up();

    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByTestId('mobile-parz-chat')).toBeVisible();
    await expectFullScreenVoiceStage(page);
    await expectNoHorizontalOverflow(page);
  });

  test('mobile voice and legacy chat share the light theme palette', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/chat');

    await expectUnifiedMobileChatTheme(page, 'rgba(0, 0, 0, 0.6)', 'rgb(255, 255, 255)');
    await expectNoHorizontalOverflow(page);
  });

  test('mobile voice and legacy chat share the dark theme palette', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/chat');

    await expectUnifiedMobileChatTheme(page, 'rgba(255, 255, 255, 0.6)', 'rgb(0, 0, 0)');
    await expectNoHorizontalOverflow(page);
  });

  test('mobile voice stop switches to talk-to-begin with compact text', async ({ page }) => {
    await page.goto('/chat');

    const action = page.getByTestId('mobile-voice-primary-action');
    await expect(action).toBeVisible();
    await expectMediumLargeVoiceScale(page);

    if ((await action.textContent()) !== 'Stop') {
      await action.click();
      await expect(action).toHaveText('Stop');
    }

    await action.click();
    await expect(action).toHaveText('Talk to begin');
  });

  test('mobile chat exits from the RHS left chevron on tap and drag', async ({ page }) => {
    await page.addInitScript(() => {
      const storageKey = '__mobileSlideViewTransitionCalls';
      if (window.sessionStorage.getItem(storageKey) === null) {
        window.sessionStorage.setItem(storageKey, '0');
      }

      const originalStartViewTransition = document.startViewTransition?.bind(document);
      if (!originalStartViewTransition) return;

      document.startViewTransition = ((callback: () => void) => {
        const previousCount = Number(window.sessionStorage.getItem(storageKey) ?? '0');
        window.sessionStorage.setItem(storageKey, String(previousCount + 1));
        return originalStartViewTransition(callback);
      }) as typeof document.startViewTransition;
    });

    await page.goto('/chat');

    await expect(page.getByRole('button', { name: 'Go back' })).toHaveCount(0);
    const exitChevron = page.getByRole('button', { name: 'Exit chat' });
    await expect(exitChevron).toBeVisible();
    await expect(exitChevron.locator('svg')).toHaveAttribute('data-direction', 'left');

    await exitChevron.click();
    const tapHomeLayer = page.getByTestId('mobile-home-continuity-layer');
    await expect(tapHomeLayer).toBeVisible();
    await expect(tapHomeLayer.getByTestId('mobile-home-role-roller')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/chat');
    const exitBox = await page.getByRole('button', { name: 'Exit chat' }).boundingBox();
    const viewport = page.viewportSize();
    expect(exitBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    await page.mouse.move(exitBox!.x + exitBox!.width / 2, exitBox!.y + exitBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(exitBox!.x + exitBox!.width / 2 - 84, exitBox!.y + exitBox!.height / 2, { steps: 4 });

    const partialState = await page.getByTestId('mobile-parz-chat').evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).transform);
      return {
        progress: Number((element as HTMLElement).dataset.exitProgress),
        translateX: matrix.m41,
      };
    });
    expect(partialState.progress).toBeGreaterThan(0.2);
    expect(partialState.progress).toBeLessThan(0.45);
    expect(partialState.translateX).toBeLessThan(-viewport!.width * 0.2);
    expect(partialState.translateX).toBeGreaterThan(-viewport!.width * 0.45);

    const draggedChevronState = await page.getByTestId('mobile-chat-exit-chevron').evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).transform);
      return matrix.m41;
    });
    expect(draggedChevronState).toBeLessThan(-80);
    expect(draggedChevronState).toBeGreaterThan(-88);

    const partialHomeLayer = page.getByTestId('mobile-home-continuity-layer');
    await expect(partialHomeLayer).toBeVisible();
    await expect(partialHomeLayer).toHaveAttribute('data-route', 'chat');
    await expect(partialHomeLayer.getByTestId('mobile-home-role-roller')).toBeVisible();
    const partialHomeLayerState = await partialHomeLayer.evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).transform);
      return {
        translateX: matrix.m41,
      };
    });
    expect(Math.abs(partialHomeLayerState.translateX)).toBeLessThan(1);

    await page.waitForTimeout(350);
    await page.mouse.up();
    await expect(page).toHaveURL(/\/chat$/);
    await expect
      .poll(async () => Number(await page.getByTestId('mobile-parz-chat').getAttribute('data-exit-progress')))
      .toBeLessThan(0.01);
    await expect(page.getByTestId('mobile-home-continuity-layer')).toHaveAttribute('data-route', 'chat');

    await page.goto('/chat');
    await expect(page.getByRole('button', { name: 'Exit chat' })).toBeVisible();

    const fullExitBox = await page.getByRole('button', { name: 'Exit chat' }).boundingBox();
    expect(fullExitBox).not.toBeNull();
    const fullExitStartX = fullExitBox!.x + fullExitBox!.width / 2;
    await page.mouse.move(fullExitStartX, fullExitBox!.y + fullExitBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(1, fullExitBox!.y + fullExitBox!.height / 2, { steps: 4 });
    await expect
      .poll(async () => Number(await page.getByTestId('mobile-parz-chat').getAttribute('data-exit-progress')))
      .toBeGreaterThan(0.72);
    await page.mouse.up();

    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(async () => Number(await page.evaluate(() => window.sessionStorage.getItem('__mobileSlideViewTransitionCalls') ?? '0')))
      .toBe(0);
  });

  test('mobile chat toggles into the legacy interface', async ({ page }) => {
    await page.goto('/chat');

    await expect(page.getByRole('button', { name: 'Go back' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Exit chat' })).toBeVisible();
    await expect(page.getByTestId('mobile-parz-chat')).toBeVisible();
    await expectFullScreenVoiceStage(page);
    await expectMobileVoiceControlsAtTop(page);
    const voiceExitMetrics = await getExitButtonMetrics(page);

    await page.getByTestId('toggle-to-legacy-chat').click();

    await expect(page.getByRole('dialog', { name: 'Parz' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close chat' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Exit chat' }).locator('svg')).toHaveAttribute(
      'data-direction',
      'left',
    );
    await expectMobileLegacyExitMatchesVoiceSize(page, voiceExitMetrics);
    await expect(page.locator('[data-chat-popup-subtitle="true"]')).toHaveText(
      'Legacy V2 Chat interface (Features may be limited)',
    );
    await expectMobileLegacyPromptsCentered(page);
    await expectNoHorizontalOverflow(page);
  });
});
