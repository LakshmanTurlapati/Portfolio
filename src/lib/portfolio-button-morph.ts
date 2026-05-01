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
  topLayer?: boolean;
}

interface StartControlMorphOptions {
  from: MorphRect;
  to: MorphRect;
  direction: 'open' | 'close';
  overlayName: 'portfolio' | 'about';
  activeDatasetKey: 'portfolioMorphActive' | 'aboutMorphActive';
  labelText: string;
  fromBackground: string;
  toBackground: string;
  fromForeground: string;
  toForeground: string;
  fromRadius: number;
  toRadius: number;
  labelFontSize: number;
  labelFontWeight: number;
  fromBoxShadow?: string;
  toBoxShadow?: string;
  duration?: number;
  topLayer?: boolean;
}

const DESKTOP_NAVBAR_WIDTH = 630;
const DESKTOP_PORTFOLIO_BUTTON_WIDTH = 200;
const DESKTOP_NAVBAR_TOP = 10;
const DESKTOP_NAVBAR_HEIGHT = 60;
const DESKTOP_NAVBAR_SOCIALS_WIDTH = 79;
const DESKTOP_ABOUT_BUTTON_WIDTH = 74;
const DESKTOP_ABOUT_BUTTON_HEIGHT = 24;
const PORTFOLIO_BACK_BUTTON_LEFT = 20;
const PORTFOLIO_BACK_BUTTON_TOP = 14;
const PORTFOLIO_BACK_BUTTON_SIZE = 48;
const ABOUT_BACK_BUTTON_TOP = 16;
const ABOUT_BACK_BUTTON_SIZE = 48;
const ABOUT_HOME_BUTTON_RECT_STORAGE_KEY = 'aboutHomeButtonRect';

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

function getDesktopAboutGutter(viewportWidth: number) {
  return Math.min(Math.max(viewportWidth * 0.08333, 48), 120);
}

export function getDesktopHomeAboutButtonRect(viewportWidth: number): MorphRect {
  const navbarLeft = (viewportWidth - DESKTOP_NAVBAR_WIDTH) / 2;
  const centerSlotWidth =
    DESKTOP_NAVBAR_WIDTH - DESKTOP_PORTFOLIO_BUTTON_WIDTH - DESKTOP_NAVBAR_SOCIALS_WIDTH;

  return {
    left: navbarLeft + DESKTOP_PORTFOLIO_BUTTON_WIDTH + (centerSlotWidth - DESKTOP_ABOUT_BUTTON_WIDTH) / 2,
    top: DESKTOP_NAVBAR_TOP + (DESKTOP_NAVBAR_HEIGHT - DESKTOP_ABOUT_BUTTON_HEIGHT) / 2,
    width: DESKTOP_ABOUT_BUTTON_WIDTH,
    height: DESKTOP_ABOUT_BUTTON_HEIGHT,
  };
}

export function getAboutBackButtonRect(viewportWidth: number): MorphRect {
  return {
    left: getDesktopAboutGutter(viewportWidth),
    top: ABOUT_BACK_BUTTON_TOP,
    width: ABOUT_BACK_BUTTON_SIZE,
    height: ABOUT_BACK_BUTTON_SIZE,
  };
}

export function storeDesktopHomeAboutButtonRect(rect: MorphRect) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ABOUT_HOME_BUTTON_RECT_STORAGE_KEY, JSON.stringify(rect));
}

export function getStoredDesktopHomeAboutButtonRect(viewportWidth: number): MorphRect {
  if (typeof window === 'undefined') return getDesktopHomeAboutButtonRect(viewportWidth);

  const stored = window.sessionStorage.getItem(ABOUT_HOME_BUTTON_RECT_STORAGE_KEY);
  if (!stored) return getDesktopHomeAboutButtonRect(viewportWidth);

  try {
    const parsed = JSON.parse(stored) as Partial<MorphRect>;
    if (
      typeof parsed.left === 'number' &&
      typeof parsed.top === 'number' &&
      typeof parsed.width === 'number' &&
      typeof parsed.height === 'number'
    ) {
      return parsed as MorphRect;
    }
  } catch {
    // Fall through to the computed navbar geometry.
  }

  return getDesktopHomeAboutButtonRect(viewportWidth);
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

function readRootColorVariable(root: HTMLElement, name: string, fallback: string) {
  return window.getComputedStyle(root).getPropertyValue(name).trim() || fallback;
}

function startControlMorph({
  from,
  to,
  direction,
  overlayName,
  activeDatasetKey,
  labelText,
  fromBackground,
  toBackground,
  fromForeground,
  toForeground,
  fromRadius,
  toRadius,
  labelFontSize,
  labelFontWeight,
  fromBoxShadow,
  toBoxShadow,
  duration = PORTFOLIO_MORPH_DURATION_MS,
  topLayer = false,
}: StartControlMorphOptions): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return Promise.resolve();

  document.querySelectorAll('[data-nav-control-morph-overlay="true"]').forEach((node) => node.remove());

  const root = document.documentElement;
  delete root.dataset.portfolioMorphActive;
  delete root.dataset.aboutMorphActive;
  root.dataset[activeDatasetKey] = 'true';

  const canUseDialog = topLayer && typeof HTMLDialogElement !== 'undefined';
  const overlay = document.createElement(canUseDialog ? 'dialog' : 'div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.dataset.navControlMorphOverlay = 'true';
  overlay.dataset.navControlMorphControl = overlayName;
  overlay.dataset.navControlMorphDirection = direction;
  overlay.dataset[`${overlayName}MorphOverlay`] = 'true';
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
    boxShadow: fromBoxShadow ?? 'none',
    overflow: 'hidden',
    contain: 'layout paint style',
    margin: '0',
    padding: '0',
    border: 'none',
    maxWidth: 'none',
    maxHeight: 'none',
  });

  const label = document.createElement('span');
  label.dataset.navControlMorphPart = 'label';
  label.dataset.navControlMorphControl = overlayName;
  label.dataset.navControlMorphDirection = direction;
  label.textContent = labelText;
  Object.assign(label.style, {
    position: 'absolute',
    fontSize: `${labelFontSize}px`,
    fontWeight: `${labelFontWeight}`,
    color: fromForeground,
    opacity: direction === 'open' ? '1' : '0',
    whiteSpace: 'nowrap',
  });

  const arrow = createArrowIcon(direction === 'open' ? toForeground : fromForeground);
  arrow.dataset.navControlMorphPart = 'arrow';
  arrow.dataset.navControlMorphControl = overlayName;
  arrow.dataset.navControlMorphDirection = direction;
  arrow.style.opacity = direction === 'open' ? '0' : '1';

  overlay.append(label, arrow);
  document.body.appendChild(overlay);
  if (overlay instanceof HTMLDialogElement) {
    try {
      overlay.showModal();
    } catch {
      overlay.setAttribute('open', '');
    }
  }

  const cleanup = () => {
    if (overlay instanceof HTMLDialogElement && overlay.open) {
      overlay.close();
    }
    overlay.remove();
    if (!document.querySelector(`[data-${overlayName}-morph-overlay="true"]`)) {
      delete root.dataset[activeDatasetKey];
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
        boxShadow: fromBoxShadow ?? 'none',
      },
      {
        left: `${to.left}px`,
        top: `${to.top}px`,
        width: `${to.width}px`,
        height: `${to.height}px`,
        borderRadius: `${toRadius}px`,
        backgroundColor: toBackground,
        color: toForeground,
        boxShadow: toBoxShadow ?? 'none',
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
      delay: direction === 'open' ? 0 : Math.round(duration * 0.25),
      duration: Math.round(duration * 0.55),
      easing: 'ease-out',
      fill: 'forwards',
    }
  );

  arrow.animate(
    { opacity: direction === 'open' ? [0, 1] : [1, 0] },
    {
      delay: direction === 'open' ? Math.round(duration * 0.25) : 0,
      duration: Math.round(duration * 0.5),
      easing: 'ease-out',
      fill: 'forwards',
    }
  );

  const finished = rectAnimation.finished.then(cleanup).catch(cleanup);
  window.setTimeout(cleanup, duration + 120);
  return finished;
}

export function startPortfolioButtonMorph({
  from,
  to,
  direction,
  isDark,
  duration = PORTFOLIO_MORPH_DURATION_MS,
  topLayer,
}: StartPortfolioButtonMorphOptions): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();

  const root = document.documentElement;
  const portfolioBackground = readRootColorVariable(
    root,
    '--color-portfolio-btn-bg',
    isDark ? '#000000' : '#FFFFFF'
  );
  const portfolioForeground = readRootColorVariable(
    root,
    '--color-portfolio-btn-text',
    isDark ? '#FFFFFF' : '#000000'
  );
  const portfolioGlow =
    '4px 0 18px 1px rgba(0,43,255,0.25), -2px 3px 18px 1px rgba(0,255,204,0.22), -2px -3px 18px 1px rgba(255,74,213,0.22)';
  const portfolioExitGlow =
    '0 0 0 1px rgba(128,128,128,0.42), 4px 0 22px 2px rgba(0,43,255,0.34), -2px 3px 22px 2px rgba(0,255,204,0.3), -2px -3px 22px 2px rgba(255,74,213,0.3)';

  return startControlMorph({
    from,
    to,
    direction,
    overlayName: 'portfolio',
    activeDatasetKey: 'portfolioMorphActive',
    labelText: 'Portfolio',
    fromBackground: portfolioBackground,
    toBackground: portfolioBackground,
    fromForeground: portfolioForeground,
    toForeground: portfolioForeground,
    fromRadius: direction === 'open' ? 25 : 12,
    toRadius: direction === 'open' ? 12 : 25,
    labelFontSize: 18,
    labelFontWeight: 600,
    fromBoxShadow: direction === 'open' ? portfolioGlow : portfolioExitGlow,
    toBoxShadow: portfolioGlow,
    duration,
    topLayer,
  });
}

export function startAboutButtonMorph({
  from,
  to,
  direction,
  duration = PORTFOLIO_MORPH_DURATION_MS,
  topLayer,
}: Omit<StartPortfolioButtonMorphOptions, 'isDark'>): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();

  const root = document.documentElement;
  const navbarText = readRootColorVariable(root, '--color-navbar-text', '#9E9E9E');
  const pageText = readRootColorVariable(root, '--color-page-inverted-text', '#FFFFFF');
  const pageBackground = readRootColorVariable(root, '--color-page-inverted-bg', '#2A2A2A');
  const aboutExitShadow =
    '0 0 0 1px color-mix(in srgb, var(--color-navbar-text) 42%, transparent), 0 12px 28px rgba(0,0,0,0.18)';

  return startControlMorph({
    from,
    to,
    direction,
    overlayName: 'about',
    activeDatasetKey: 'aboutMorphActive',
    labelText: 'About Me',
    fromBackground: direction === 'open' ? 'rgba(0, 0, 0, 0)' : pageText,
    toBackground: direction === 'open' ? pageText : 'rgba(0, 0, 0, 0)',
    fromForeground: direction === 'open' ? navbarText : pageBackground,
    toForeground: direction === 'open' ? pageBackground : navbarText,
    fromRadius: direction === 'open' ? 6 : 12,
    toRadius: direction === 'open' ? 12 : 6,
    labelFontSize: 16,
    labelFontWeight: 700,
    fromBoxShadow: direction === 'close' ? aboutExitShadow : 'none',
    toBoxShadow: 'none',
    duration,
    topLayer,
  });
}
