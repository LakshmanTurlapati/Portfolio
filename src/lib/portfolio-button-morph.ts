export const PORTFOLIO_MORPH_DURATION_MS = 500;

export interface MorphRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface StartPortfolioButtonMorphOptions {
  from: MorphRect;
  to: MorphRect;
  direction: 'open' | 'close';
  isDark: boolean;
  duration?: number;
}

const DESKTOP_NAVBAR_WIDTH = 630;
const DESKTOP_PORTFOLIO_BUTTON_WIDTH = 200;
const DESKTOP_NAVBAR_TOP = 10;
const DESKTOP_NAVBAR_HEIGHT = 60;
const PORTFOLIO_BACK_BUTTON_LEFT = 20;
const PORTFOLIO_BACK_BUTTON_TOP = 14;
const PORTFOLIO_BACK_BUTTON_SIZE = 48;

export function rectFromDomRect(rect: DOMRect | DOMRectReadOnly): MorphRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function getDesktopHomePortfolioButtonRect(viewportWidth: number): MorphRect {
  return {
    left: (viewportWidth - DESKTOP_NAVBAR_WIDTH) / 2,
    top: DESKTOP_NAVBAR_TOP,
    width: DESKTOP_PORTFOLIO_BUTTON_WIDTH,
    height: DESKTOP_NAVBAR_HEIGHT,
  };
}

export function getPortfolioBackButtonRect(): MorphRect {
  return {
    left: PORTFOLIO_BACK_BUTTON_LEFT,
    top: PORTFOLIO_BACK_BUTTON_TOP,
    width: PORTFOLIO_BACK_BUTTON_SIZE,
    height: PORTFOLIO_BACK_BUTTON_SIZE,
  };
}

function setRectStyles(element: HTMLElement, rect: MorphRect) {
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

function createArrowIcon(color: string) {
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  Object.assign(icon.style, {
    position: 'absolute',
    width: '14px',
    height: '14px',
    borderLeft: `2px solid ${color}`,
    borderBottom: `2px solid ${color}`,
    transform: 'rotate(45deg)',
  });
  return icon;
}

export function startPortfolioButtonMorph({
  from,
  to,
  direction,
  isDark,
  duration = PORTFOLIO_MORPH_DURATION_MS,
}: StartPortfolioButtonMorphOptions) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  document.querySelectorAll('[data-portfolio-morph-overlay="true"]').forEach((node) => node.remove());

  const root = document.documentElement;
  root.dataset.portfolioMorphActive = 'true';

  const homeBackground = isDark ? '#000000' : '#FFFFFF';
  const homeForeground = isDark ? '#FFFFFF' : '#000000';
  const backBackground = isDark ? '#FFFFFF' : '#000000';
  const backForeground = isDark ? '#000000' : '#FFFFFF';

  const fromBackground = direction === 'open' ? homeBackground : backBackground;
  const toBackground = direction === 'open' ? backBackground : homeBackground;
  const fromForeground = direction === 'open' ? homeForeground : backForeground;
  const toForeground = direction === 'open' ? backForeground : homeForeground;
  const fromRadius = direction === 'open' ? 25 : 12;
  const toRadius = direction === 'open' ? 12 : 25;

  const overlay = document.createElement('div');
  overlay.dataset.portfolioMorphOverlay = 'true';
  setRectStyles(overlay, from);
  Object.assign(overlay.style, {
    position: 'fixed',
    zIndex: '2147483647',
    pointerEvents: 'none',
    display: 'grid',
    placeItems: 'center',
    borderRadius: `${fromRadius}px`,
    backgroundColor: fromBackground,
    color: fromForeground,
    boxShadow:
      direction === 'open'
        ? '4px 0 18px 1px rgba(0,43,255,0.25), -2px 3px 18px 1px rgba(0,255,204,0.22), -2px -3px 18px 1px rgba(255,74,213,0.22)'
        : 'none',
    overflow: 'hidden',
    contain: 'layout paint style',
  });

  const label = document.createElement('span');
  label.textContent = 'Portfolio';
  Object.assign(label.style, {
    position: 'absolute',
    fontSize: '18px',
    fontWeight: '600',
    color: fromForeground,
    opacity: direction === 'open' ? '1' : '0',
  });

  const arrow = createArrowIcon(direction === 'open' ? toForeground : fromForeground);
  arrow.style.opacity = direction === 'open' ? '0' : '1';

  overlay.append(label, arrow);
  document.body.appendChild(overlay);

  const cleanup = () => {
    overlay.remove();
    if (!document.querySelector('[data-portfolio-morph-overlay="true"]')) {
      delete root.dataset.portfolioMorphActive;
    }
  };

  const rectAnimation = overlay.animate(
    [
      {
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        borderRadius: `${fromRadius}px`,
        backgroundColor: fromBackground,
        color: fromForeground,
      },
      {
        left: `${to.left}px`,
        top: `${to.top}px`,
        width: `${to.width}px`,
        height: `${to.height}px`,
        borderRadius: `${toRadius}px`,
        backgroundColor: toBackground,
        color: toForeground,
      },
    ],
    {
      duration,
      easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
      fill: 'forwards',
    }
  );

  label.animate(
    { opacity: direction === 'open' ? [1, 0] : [0, 1], color: [fromForeground, toForeground] },
    {
      duration: Math.round(duration * 0.55),
      easing: 'ease-out',
      fill: 'forwards',
    }
  );

  arrow.animate(
    { opacity: direction === 'open' ? [0, 1] : [1, 0] },
    {
      delay: Math.round(duration * 0.25),
      duration: Math.round(duration * 0.5),
      easing: 'ease-out',
      fill: 'forwards',
    }
  );

  rectAnimation.finished.then(cleanup).catch(cleanup);
  window.setTimeout(cleanup, duration + 120);
}
