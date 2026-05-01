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
  originBackground: string;
  frames: Array<{
    t: number;
    state: string | null;
    source: string | null;
    rect: TestRect;
    background: string;
    color: string;
    contentOpacity: string;
    contentPointerEvents: string;
    voicePreviewCount: number;
    voiceControlCount: number;
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
        const originBackground = window.getComputedStyle(origin).backgroundColor;
        const frames: MorphCapture['frames'] = [];
        const start = performance.now();

        switchButton.click();

        const tick = () => {
          const card = document.querySelector('[data-chat-popup-card]');
          if (card) {
            const style = window.getComputedStyle(card);
            const content = card.querySelector('[data-chat-popup-content]');
            const contentStyle = content ? window.getComputedStyle(content) : null;
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
                background: style.backgroundColor,
                color: style.color,
                contentOpacity: contentStyle?.opacity ?? '',
                contentPointerEvents: contentStyle?.pointerEvents ?? '',
                voicePreviewCount: card.querySelectorAll('[data-chat-voice-preview]').length,
                voiceControlCount: card.querySelectorAll(
                  'button[title="Switch to text chat"], button[title="Stop"], button[title="Close voice mode"]',
                ).length,
              });
            }
          }

          if (performance.now() - start > 500) {
            resolve({ originRect, originBackground, frames });
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

function expectNoVoicePreview(frame: MorphCapture['frames'][number]) {
  expect(frame.voicePreviewCount).toBe(0);
  expect(frame.voiceControlCount).toBe(0);
}

function expectBlankMorphFrames(morphStart: MorphCapture) {
  const morphFrames = morphStart.frames.filter((frame) => frame.t < 500);
  expect(morphFrames.length).toBeGreaterThan(1);

  for (const frame of morphFrames) {
    expect(frame.state).not.toBe('content');
    expect(frame.background).toBe(morphStart.originBackground);
    expect(frame.contentOpacity).toBe('0');
    expect(frame.contentPointerEvents).toBe('none');
    expectNoVoicePreview(frame);
  }
}

async function expectLegacyChatPanelSurface(
  page: Page,
  expectedBackground: string,
  expectedColor: string,
  expectedBorderRadius = '15px',
) {
  await expect(page.locator('[data-chat-popup-subtitle="true"]')).toHaveText(
    'Legacy V2 Chat interface (Features may be limited)',
  );

  await expect
    .poll(async () =>
      page.locator('[data-chat-popup-card]').evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
        };
      }),
    )
    .toEqual({
      background: expectedBackground,
      color: expectedColor,
      borderRadius: expectedBorderRadius,
    });
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
  await page.route(`https://api.github.com/repos/${repoPath}/contents?ref=main`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          name: 'src',
          path: 'src',
          type: 'dir',
          html_url: `https://github.com/${repoPath}/tree/main/src`,
        },
        {
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          size: 4096,
          html_url: `https://github.com/${repoPath}/blob/main/README.md`,
        },
      ]),
    });
  });
  await page.route('https://api.github.com/markdown', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: `
        <h1>Review Gate</h1>
        <p>Mocked README content with a <a href="docs/setup.md">relative guide</a>.</p>
        <p><img src="docs/diagram.png" alt="Relative diagram"></p>
        <table><thead><tr><th>Feature</th><th>Status</th></tr></thead><tbody><tr><td>Preview</td><td>Ready</td></tr></tbody></table>
        <ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled> Rich README</li></ul>
        <section class="js-render-needs-enrichment render-needs-enrichment" data-type="mermaid">
          <div class="js-render-enrichment-target" data-plain="graph TD&#10;  A--&gt;B&#10;">
            <pre lang="mermaid">graph TD
  A--&gt;B
</pre>
          </div>
        </section>
        ${'<p>Mocked README content.</p>'.repeat(80)}
      `,
    });
  });
}

test('Parz site control navigates, scrolls, opens GitFly, and shows the FSB badge', async ({ page }) => {
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
  await expect(page.getByText('README.md', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('src', { exact: true })).toBeVisible();
  await expect(page.locator('.ghx-md-readme table')).toBeVisible();
  await expect(page.locator('.ghx-mermaid-block')).toBeVisible();
  await expect(page.locator('.ghx-md-readme img[alt="Relative diagram"]')).toHaveAttribute(
    'src',
    'https://raw.githubusercontent.com/LakshmanTurlapati/Review-Gate/main/docs/diagram.png',
  );
  await expect(page.locator('.ghx-md-readme a', { hasText: 'relative guide' })).toHaveAttribute(
    'href',
    'https://github.com/LakshmanTurlapati/Review-Gate/blob/main/docs/setup.md',
  );
  await waitForControlIdle(page);

  await expect
    .poll(
      () => page.evaluate(() =>
        (window as WindowWithSiteControl).__parzSiteControl?.scrollProjectPreview('down')
      ),
      { timeout: 5000 },
    )
    .toMatchObject({ ok: true });
  await expect(page.getByText('powered by FSB')).toBeVisible();
  await expect(page.locator('.fsb-control-viewport-glow')).toHaveCount(0);
  await expect(page.getByTestId('fsb-preview-control-overlay')).toHaveCount(0);
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
  await page.emulateMedia({ colorScheme: 'light' });
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
  expectBlankMorphFrames(morphStart);

  const chatCard = page.locator('[data-chat-popup-card]');
  await expect(chatCard).toHaveAttribute('data-chat-morph-source', 'voice');
  await expect(chatCard).toHaveAttribute('data-chat-morph-state', /origin|expanding|content/);
  await expect(page.getByRole('dialog', { name: 'Parz' })).toBeVisible();
  await expect(chatCard).toHaveAttribute('data-chat-morph-state', 'content');
  await expectLegacyChatPanelSurface(page, 'rgba(0, 0, 0, 0.6)', 'rgb(255, 255, 255)');

  const chatBox = await chatCard.boundingBox();
  const viewport = page.viewportSize();
  expect(chatBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs(chatBox!.x + chatBox!.width / 2 - viewport!.width / 2)).toBeLessThanOrEqual(2);
  expect(Math.abs(chatBox!.y + chatBox!.height / 2 - viewport!.height / 2)).toBeLessThanOrEqual(2);
  await expect(page.locator('.fsb-control-overlay')).toHaveCount(0);
  await expect(page.locator('.fsb-control-viewport-glow')).toHaveCount(0);
});

test('mobile chevron opens default Parz chat and toggles to legacy chat', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSpeechTokenFailure(page);
  await page.goto('/');

  await expect(page.locator('button[aria-label="Activate Parz voice mode"]:visible')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open chat' }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByTestId('mobile-parz-chat')).toBeVisible();
  await expect(page.getByTestId('mobile-parz-voice-stage')).toHaveCSS('border-radius', '0px');
  await expect(page.getByTestId('toggle-to-legacy-chat')).toBeVisible();

  await page.getByTestId('toggle-to-legacy-chat').click();

  const chatCard = page.locator('[data-chat-popup-card]');
  await expect(page.getByRole('dialog', { name: 'Parz' })).toBeVisible();
  await expect(chatCard).toHaveAttribute('data-chat-morph-state', 'static');
  await expectLegacyChatPanelSurface(page, 'rgba(0, 0, 0, 0.6)', 'rgb(255, 255, 255)', '0px');
  await expect(page.locator('.fsb-control-overlay')).toHaveCount(0);
  await expect(page.locator('.fsb-control-viewport-glow')).toHaveCount(0);
});

test('dark theme voice-to-text morph uses the matching light panel surface', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
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
  expectBlankMorphFrames(morphStart);

  const chatCard = page.locator('[data-chat-popup-card]');
  await expect(page.getByRole('dialog', { name: 'Parz' })).toBeVisible();
  await expect(chatCard).toHaveAttribute('data-chat-morph-state', 'content');
  await expectLegacyChatPanelSurface(page, 'rgba(255, 255, 255, 0.6)', 'rgb(0, 0, 0)');
  await expect(page.locator('.fsb-control-overlay')).toHaveCount(0);
  await expect(page.locator('.fsb-control-viewport-glow')).toHaveCount(0);
});
