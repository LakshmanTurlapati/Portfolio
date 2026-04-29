import { expect, test, type Page } from '@playwright/test';

type ParzSiteControl = {
  navigate: (page: 'home' | 'portfolio' | 'about') => { ok: boolean; message: string };
  scrollTo: (section: string) => { ok: boolean; message: string };
  openProject: (name: string) => { ok: boolean; message: string };
  scrollProjectPreview: (direction?: 'down' | 'up' | 'top' | 'bottom') => { ok: boolean; message: string };
};

type WindowWithSiteControl = Window & { __parzSiteControl?: ParzSiteControl };

type TestRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MorphCapture = {
  originRect: TestRect;
  frames: Array<{
    t: number;
    state: string | null;
    source: string | null;
    rect: TestRect;
  }>;
};

async function waitForSiteControl(page: Page) {
  await page.waitForFunction(() => Boolean((window as WindowWithSiteControl).__parzSiteControl));
}

async function waitForControlIdle(page: Page) {
  await expect(page.getByText('powered by FSB')).toBeHidden();
}

async function mockSpeechTokenFailure(page: Page) {
  await page.route('**/api/stt-token', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Mocked speech token failure' }),
    });
  });
}

async function captureSwitchToTextMorphStart(page: Page): Promise<MorphCapture> {
  return page.evaluate(
    () =>
      new Promise<MorphCapture>((resolve, reject) => {
        const toRect = (rect: DOMRect): TestRect => ({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
        const isVisible = (element: Element): element is HTMLElement => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };

        const origin = Array.from(document.querySelectorAll('[data-chat-morph-origin="true"]')).find(isVisible);
        const switchButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button[title="Switch to text chat"]')).find(isVisible);

        if (!origin || !switchButton) {
          reject(new Error('Visible voice morph origin or switch-to-text button was not found.'));
          return;
        }

        const originRect = toRect(origin.getBoundingClientRect());
        const frames: MorphCapture['frames'] = [];
        const start = performance.now();

        switchButton.click();

        const tick = () => {
          const card = document.querySelector('[data-chat-popup-card]');
          if (card) {
            const style = window.getComputedStyle(card);
            const rect = card.getBoundingClientRect();
            if (
              rect.width > 0 &&
              rect.height > 0 &&
              style.visibility !== 'hidden' &&
              Number(style.opacity) > 0
            ) {
              frames.push({
                t: Math.round(performance.now() - start),
                state: card.getAttribute('data-chat-morph-state'),
                source: card.getAttribute('data-chat-morph-source'),
                rect: toRect(rect),
              });
            }
          }

          if (frames.length >= 2 || performance.now() - start > 180) {
            resolve({ originRect, frames });
            return;
          }

          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
  );
}

function expectRectNear(actual: TestRect, expected: TestRect, tolerance = 8) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.width - expected.width)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.height - expected.height)).toBeLessThanOrEqual(tolerance);
}

async function mockReviewGateGithubPreview(page: Page) {
  const repoPath = 'LakshmanTurlapati/Review-Gate';
  await page.route(`https://api.github.com/repos/${repoPath}`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Review-Gate',
        full_name: repoPath,
        description: 'Mocked preview repository for site-control tests.',
        homepage: null,
        html_url: `https://github.com/${repoPath}`,
        private: false,
        fork: false,
        archived: false,
        default_branch: 'main',
        stargazers_count: 7,
        forks_count: 2,
        watchers_count: 3,
        subscribers_count: 3,
        open_issues_count: 1,
        pushed_at: '2026-01-10T00:00:00Z',
        topics: ['review', 'automation'],
        license: null,
        owner: {
          login: 'LakshmanTurlapati',
          html_url: 'https://github.com/LakshmanTurlapati',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        },
      }),
    });
  });
  await page.route(`https://api.github.com/repos/${repoPath}/readme`, async (route) => {
    await route.fulfill({
      contentType: 'text/plain',
      body: '# Review Gate\n\nThis mocked README is intentionally long enough to scroll.\n\n'.repeat(80),
    });
  });
  await page.route(`https://api.github.com/repos/${repoPath}/contributors?per_page=8`, async (route) => {
    await route.fulfill({ contentType: 'application/json', body: '[]' });
  });
  await page.route(`https://api.github.com/repos/${repoPath}/languages`, async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ TypeScript: 1200 }) });
  });
  await page.route('https://api.github.com/markdown', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: '<h1>Review Gate</h1><p>Mocked README content.</p>'.repeat(80),
    });
  });
}

test('Parz site control navigates, scrolls, opens GitFly, and shows FSB overlay', async ({ page }) => {
  await mockReviewGateGithubPreview(page);
  await page.goto('/');
  await waitForSiteControl(page);

  await page.evaluate(() => (window as WindowWithSiteControl).__parzSiteControl?.navigate('portfolio'));
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByText('powered by FSB')).toBeVisible();
  await waitForControlIdle(page);

  await waitForSiteControl(page);
  await page.evaluate(() => (window as WindowWithSiteControl).__parzSiteControl?.scrollTo('experience'));
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

  await waitForSiteControl(page);
  await page.evaluate(() => (window as WindowWithSiteControl).__parzSiteControl?.openProject('GitFly'));
  await expect(page.getByText('powered by FSB')).toBeVisible();
  await expect(page.getByText('gitfly.ai', { exact: true })).toBeVisible();
  await waitForControlIdle(page);

  await page.evaluate(() => (window as WindowWithSiteControl).__parzSiteControl?.openProject('Review Gate'));
  await expect(page.getByText('Review-Gate', { exact: true }).first()).toBeVisible();
  await waitForControlIdle(page);

  await expect
    .poll(
      () => page.evaluate(() =>
        (window as WindowWithSiteControl).__parzSiteControl?.scrollProjectPreview('down')
      ),
      { timeout: 5000 },
    )
    .toMatchObject({ ok: true });
  await expect(page.locator('.fsb-control-viewport-glow')).toBeVisible();
  await expect(page.getByTestId('fsb-preview-control-overlay')).toBeVisible();
  await expect(page.locator('.fsb-control-action-pulse')).toHaveCount(0);
});

test('same-page site-control navigation does not show the FSB overlay', async ({ page }) => {
  await page.goto('/');
  await waitForSiteControl(page);

  const result = await page.evaluate(() => (window as WindowWithSiteControl).__parzSiteControl?.navigate('home'));

  expect(result).toMatchObject({ ok: true });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.fsb-control-overlay')).toHaveCount(0);
  await expect(page.locator('.fsb-control-viewport-glow')).toHaveCount(0);
});

test('switching from voice mode to text chat does not show the FSB overlay', async ({ page }) => {
  await mockSpeechTokenFailure(page);
  await page.goto('/');

  await page.locator('button[aria-label="Activate Parz voice mode"]:visible').click();
  await page.waitForTimeout(650);
  const switchToText = page.locator('button[title="Switch to text chat"]:visible');
  await expect(switchToText).toBeVisible();

  const morphStart = await captureSwitchToTextMorphStart(page);
  expect(morphStart.frames.length).toBeGreaterThan(0);
  expect(morphStart.frames[0].source).toBe('voice');
  expect(morphStart.frames[0].state).toBe('origin');
  expectRectNear(morphStart.frames[0].rect, morphStart.originRect);

  const chatCard = page.locator('[data-chat-popup-card]');
  await expect(chatCard).toHaveAttribute('data-chat-morph-source', 'voice');
  await expect(chatCard).toHaveAttribute('data-chat-morph-state', /origin|expanding|content/);
  await expect(page.getByRole('dialog', { name: 'Parz' })).toBeVisible();
  await expect(chatCard).toHaveAttribute('data-chat-morph-state', 'content');

  const chatBox = await chatCard.boundingBox();
  const viewport = page.viewportSize();
  expect(chatBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs(chatBox!.x + chatBox!.width / 2 - viewport!.width / 2)).toBeLessThanOrEqual(2);
  expect(Math.abs(chatBox!.y + chatBox!.height / 2 - viewport!.height / 2)).toBeLessThanOrEqual(2);
  await expect(page.locator('.fsb-control-overlay')).toHaveCount(0);
  await expect(page.locator('.fsb-control-viewport-glow')).toHaveCount(0);
});

test('mobile voice-to-text morph starts from the visible dock', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSpeechTokenFailure(page);
  await page.goto('/');

  await page.locator('button[aria-label="Activate Parz voice mode"]:visible').click();
  await page.waitForTimeout(650);
  await expect(page.locator('button[title="Switch to text chat"]:visible')).toBeVisible();

  const morphStart = await captureSwitchToTextMorphStart(page);
  expect(morphStart.frames.length).toBeGreaterThan(0);
  expect(morphStart.frames[0].source).toBe('voice');
  expect(morphStart.frames[0].state).toBe('origin');
  expectRectNear(morphStart.frames[0].rect, morphStart.originRect);

  const chatCard = page.locator('[data-chat-popup-card]');
  await expect(page.getByRole('dialog', { name: 'Parz' })).toBeVisible();
  await expect(chatCard).toHaveAttribute('data-chat-morph-state', 'content');
  await expect(page.locator('.fsb-control-overlay')).toHaveCount(0);
  await expect(page.locator('.fsb-control-viewport-glow')).toHaveCount(0);
});
