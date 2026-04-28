import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getDesktopHomePortfolioButtonRect,
  getPortfolioBackButtonRect,
} from '@/lib/portfolio-button-morph';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('portfolio overlay morph contract', () => {
  it('keeps the circular reveal root-only and free of named shared elements', () => {
    const transitionProvider = source('src/providers/transition-provider.tsx');
    const css = source('src/app/globals.css');

    expect(transitionProvider).toContain("pseudoElement: '::view-transition-new(root)'");
    expect(transitionProvider).toContain('`circle(0px at ${originX}px ${originY}px)`');
    expect(transitionProvider).not.toContain('NavigateWithRevealOptions');
    expect(transitionProvider).not.toContain('sharedElement');
    expect(transitionProvider).not.toContain('revealDirection');
    expect(transitionProvider).not.toContain('portfolioButtonHero');

    expect(css).not.toContain('view-transition-name: portfolio-button-hero');
    expect(css).not.toContain('::view-transition-group(portfolio-button-hero)');
  });

  it('uses a separate desktop overlay morph instead of native View Transition groups', () => {
    const portfolioButton = source('src/components/portfolio-button.tsx');
    const portfolioPage = source('src/app/portfolio/page.tsx');
    const aboutPage = source('src/app/about/page.tsx');

    expect(portfolioButton).toContain('startPortfolioButtonMorph');
    expect(portfolioButton).toContain('data-portfolio-morph-source="true"');
    expect(portfolioButton).toContain("direction: 'open'");
    expect(portfolioButton).not.toContain('portfolio-button-hero');
    expect(portfolioButton).not.toContain('sharedElement');

    expect(portfolioPage).toContain('startPortfolioButtonMorph');
    expect(portfolioPage).toContain('data-portfolio-morph-target="true"');
    expect(portfolioPage).toContain('getDesktopHomePortfolioButtonRect(window.innerWidth)');
    expect(portfolioPage).toContain("direction: 'close'");
    expect(portfolioPage).not.toContain('portfolio-button-hero');

    expect(aboutPage).not.toContain('data-portfolio-morph-target');
  });

  it('keeps mobile out of the overlay morph', () => {
    const portfolioButton = source('src/components/portfolio-button.tsx');
    const mobileBranch = portfolioButton.slice(portfolioButton.indexOf('Mobile variant'));

    expect(mobileBranch).not.toContain('data-portfolio-morph-source');
    expect(mobileBranch).not.toContain('startPortfolioButtonMorph');
  });

  it('matches the Flutter desktop geometry used by the morph overlay', () => {
    expect(getDesktopHomePortfolioButtonRect(1280)).toEqual({
      left: 325,
      top: 10,
      width: 200,
      height: 60,
    });
    expect(getPortfolioBackButtonRect()).toEqual({
      left: 20,
      top: 14,
      width: 48,
      height: 48,
    });
  });
});
