import { expect, test } from '@playwright/test';

type ParzSiteControl = {
  navigate: (page: 'home' | 'portfolio' | 'about') => { ok: boolean; message: string };
  scrollTo: (section: string) => { ok: boolean; message: string };
  openProject: (name: string) => { ok: boolean; message: string };
  scrollProjectPreview: (direction?: 'down' | 'up' | 'top' | 'bottom') => { ok: boolean; message: string };
};

type WindowWithSiteControl = Window & { __parzSiteControl?: ParzSiteControl };

async function waitForSiteControl(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => Boolean((window as WindowWithSiteControl).__parzSiteControl));
}

async function waitForControlIdle(page: import('@playwright/test').Page) {
  await expect(page.getByText('powered by FSB')).toBeHidden();
}

async function mockReviewGateGithubPreview(page: import('@playwright/test').Page) {
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
