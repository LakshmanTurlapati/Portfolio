import { expect, test } from '@playwright/test';

type ParzSiteControl = {
  navigate: (page: 'home' | 'portfolio' | 'about') => { ok: boolean; message: string };
  scrollTo: (section: string) => { ok: boolean; message: string };
  openProject: (name: string) => { ok: boolean; message: string };
};

declare global {
  interface Window {
    __parzSiteControl?: ParzSiteControl;
  }
}

async function waitForSiteControl(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => Boolean(window.__parzSiteControl));
}

async function waitForControlIdle(page: import('@playwright/test').Page) {
  await expect(page.getByText('powered by FSB')).toBeHidden();
}

test('Parz site control navigates, scrolls, opens GitFly, and shows FSB overlay', async ({ page }) => {
  await page.goto('/');
  await waitForSiteControl(page);

  await page.evaluate(() => window.__parzSiteControl?.navigate('portfolio'));
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByText('powered by FSB')).toBeVisible();
  await waitForControlIdle(page);

  await waitForSiteControl(page);
  await page.evaluate(() => window.__parzSiteControl?.scrollTo('experience'));
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

  await waitForSiteControl(page);
  await page.evaluate(() => window.__parzSiteControl?.openProject('GitFly'));
  await expect(page.getByText('powered by FSB')).toBeVisible();
  await expect(page.getByText('gitfly.ai', { exact: true })).toBeVisible();
});
