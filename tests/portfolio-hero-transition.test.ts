import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getAboutBackButtonRect,
  getDesktopHomeAboutButtonRect,
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
    expect(transitionProvider).toContain("pseudoElement: '::view-transition-old(root)'");
    expect(transitionProvider).toContain('`circle(0px at ${originX}px ${originY}px)`');
    expect(transitionProvider).toContain("mode === 'collapse'");
    expect(transitionProvider).toContain("fill: 'both'");
    expect(transitionProvider).toContain('navigatePlain');
    expect(transitionProvider).not.toContain('sharedElement');
    expect(transitionProvider).not.toContain('revealDirection');
    expect(transitionProvider).not.toContain('portfolioButtonHero');

    expect(css).toContain('::view-transition-group(root)');
    expect(css).toContain('::view-transition-image-pair(root)');
    expect(css).toContain('animation: none');
    expect(css).toContain('transform: none');
    expect(css).not.toContain('view-transition-name: portfolio-button-hero');
    expect(css).not.toContain('::view-transition-group(portfolio-button-hero)');
  });

  it('routes about and home navigation through the circular reveal path', () => {
    const transitionProvider = source('src/providers/transition-provider.tsx');
    const desktopNavbar = source('src/components/desktop-navbar.tsx');
    const mobileNavbar = source('src/components/mobile-navbar.tsx');
    const aboutPage = source('src/app/about/page.tsx');
    const homePage = source('src/app/page.tsx');
    const siteControl = source('src/providers/site-control-provider.tsx');
    const voiceSession = source('src/providers/voice-session-provider.tsx');
    const plainStart = transitionProvider.indexOf('const navigatePlain');
    const plainEnd = transitionProvider.indexOf('const navigateWithSlide');
    const plainBlock = transitionProvider.slice(plainStart, plainEnd);

    expect(transitionProvider).toContain("navigatePlain: (path: string) => void");
    expect(plainBlock).toContain('router.push(path)');
    expect(plainBlock).toContain('emitPageReady(path)');
    expect(plainBlock).not.toContain('gsap.to(overlay');
    expect(plainBlock).not.toContain('clipPath');
    expect(transitionProvider).toContain('data-testid="route-reveal-overlay"');
    expect(transitionProvider).not.toContain('data-testid="plain-route-overlay"');
    expect(plainBlock).not.toContain('startViewTransition');
    expect(plainBlock).not.toContain('document.documentElement.animate');

    expect(desktopNavbar).toContain("navigateWithReveal('/about'");
    expect(mobileNavbar).toContain("navigateWithReveal('/about'");
    expect(aboutPage).toContain("navigateWithReveal('/'");
    expect(homePage).toContain('data-testid="mobile-home-route-shell"');
    expect(siteControl).toContain('navigateWithReveal(path, window.innerWidth / 2, window.innerHeight / 2)');
    expect(siteControl).toContain('navigateWithReveal(PAGE_PATHS.about');
    expect(siteControl).not.toContain('navigatePlain');
    expect(voiceSession).toContain("navigatePlain('/')");
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
    expect(portfolioPage).toContain("{ mode: 'collapse' }");
    expect(portfolioPage).not.toContain('portfolio-button-hero');

    expect(aboutPage).toContain('startAboutButtonMorph');
    expect(aboutPage).toContain('data-about-morph-target');
    expect(aboutPage).toContain('getStoredDesktopHomeAboutButtonRect(window.innerWidth)');
    expect(aboutPage).toContain("{ mode: 'collapse' }");
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
    expect(getDesktopHomeAboutButtonRect(1280)).toEqual({
      left: 663.5,
      top: 28,
      width: 74,
      height: 24,
    });
    expect(getAboutBackButtonRect(1280)).toEqual({
      left: 106.6624,
      top: 16,
      width: 48,
      height: 48,
    });
  });
});
