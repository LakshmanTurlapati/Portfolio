'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { FsbControlOverlay } from '@/components/fsb-control-overlay';
import { IframeViewer } from '@/components/iframe-viewer';
import { getProjectBrowserTarget, resolveProject } from '@/data/projects';
import {
  normalizePreviewScrollDirection,
  normalizeSection,
  type ControlSection,
  type PreviewScrollDirection,
  type PreviewScroller,
} from '@/lib/site-control-utils';
import { useTransition } from '@/providers/transition-provider';

export type ControlPage = 'home' | 'portfolio' | 'about';

export interface ControlResult {
  ok: boolean;
  message: string;
}

interface BrowserState {
  url: string;
  label: string;
  projectName: string;
}

type ControlOverlayScope = 'page' | 'preview';

interface SiteControlContextType {
  navigate: (page: ControlPage) => ControlResult;
  openProject: (input: string) => ControlResult;
  scrollTo: (section: ControlSection | string) => ControlResult;
  scrollProjectPreview: (direction?: PreviewScrollDirection | string) => ControlResult;
  closeBrowser: () => ControlResult;
  openCurrentProjectExternal: () => ControlResult;
  unsupportedIframeControl: () => ControlResult;
  registerAboutScroller: (scroller: ((section: ControlSection) => void) | null) => () => void;
}

declare global {
  interface Window {
    __parzSiteControl?: SiteControlContextType;
  }
}

const SiteControlContext = createContext<SiteControlContextType | null>(null);

const PAGE_PATHS: Record<ControlPage, string> = {
  home: '/',
  portfolio: '/portfolio',
  about: '/about',
};

export function useSiteControl(): SiteControlContextType {
  const context = useContext(SiteControlContext);
  if (!context) throw new Error('useSiteControl must be used inside SiteControlProvider');
  return context;
}

export function SiteControlProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { navigateWithReveal } = useTransition();
  const [browser, setBrowser] = useState<BrowserState | null>(null);
  const [controlOverlayActive, setControlOverlayActive] = useState(false);
  const [controlOverlayScope, setControlOverlayScope] = useState<ControlOverlayScope>('page');
  const aboutScrollerRef = useRef<((section: ControlSection) => void) | null>(null);
  const previewScrollerRef = useRef<PreviewScroller | null>(null);
  const pendingSectionRef = useRef<ControlSection | null>(null);
  const overlayHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (overlayHideTimerRef.current) window.clearTimeout(overlayHideTimerRef.current);
    };
  }, []);

  const runWithControlOverlay = useCallback((
    action: () => ControlResult,
    scope: ControlOverlayScope = 'page',
  ): ControlResult => {
    if (overlayHideTimerRef.current) window.clearTimeout(overlayHideTimerRef.current);
    setControlOverlayScope(scope);
    setControlOverlayActive(true);

    try {
      return action();
    } finally {
      // Phase 27 / FSB-04: extended from 900ms to 3500ms so the FSB overlay's
      // caption state machine (success: 1500ms hold + 200ms fade; error: 3000ms
      // hold + 200ms fade) finishes inside the visible overlay before unmount.
      // 3500ms = 3000ms (error hold) + 200ms (fade-out) + 300ms (safety margin).
      overlayHideTimerRef.current = window.setTimeout(() => {
        setControlOverlayActive(false);
        setControlOverlayScope('page');
        overlayHideTimerRef.current = null;
      }, 3500);
    }
  }, []);

  const navigate = useCallback(
    (page: ControlPage): ControlResult => {
      const path = PAGE_PATHS[page];
      if (pathname === path) {
        return { ok: true, message: `Already on ${page}.` };
      }

      return runWithControlOverlay(() => {
        navigateWithReveal(path, window.innerWidth / 2, window.innerHeight / 2);
        return { ok: true, message: `Heading to ${page}.` };
      });
    },
    [navigateWithReveal, pathname, runWithControlOverlay]
  );

  const openProject = useCallback((input: string): ControlResult => {
    return runWithControlOverlay(() => {
      const project = resolveProject(input);
      const target = project ? getProjectBrowserTarget(project) : null;

      if (!project || !target) {
        return { ok: false, message: "I couldn't find an approved project target for that." };
      }

      previewScrollerRef.current = null;
      setBrowser({ ...target, projectName: project.name });
      return { ok: true, message: `Opening ${project.name}.` };
    });
  }, [runWithControlOverlay]);

  const scrollTo = useCallback(
    (sectionInput: ControlSection | string): ControlResult => {
      return runWithControlOverlay(() => {
        const section = normalizeSection(sectionInput);
        if (!section) return { ok: false, message: "I couldn't find that portfolio section." };

        if (pathname !== '/about') {
          pendingSectionRef.current = section;
          navigateWithReveal(PAGE_PATHS.about, window.innerWidth / 2, window.innerHeight / 2);
          return { ok: true, message: `Taking you to ${section}.` };
        }

        if (aboutScrollerRef.current) {
          aboutScrollerRef.current(section);
          return { ok: true, message: `Taking you to ${section}.` };
        }

        pendingSectionRef.current = section;
        return { ok: true, message: `Taking you to ${section}.` };
      });
    },
    [navigateWithReveal, pathname, runWithControlOverlay]
  );

  const closeBrowser = useCallback((): ControlResult => {
    return runWithControlOverlay(() => {
      if (!browser) return { ok: false, message: 'There is no project browser open right now.' };
      previewScrollerRef.current = null;
      setBrowser(null);
      return { ok: true, message: 'Closing the browser view.' };
    });
  }, [browser, runWithControlOverlay]);

  const scrollProjectPreview = useCallback(
    (directionInput: PreviewScrollDirection | string = 'down'): ControlResult => {
      return runWithControlOverlay(() => {
        if (!browser) return { ok: false, message: 'There is no project browser open right now.' };
        const direction = normalizePreviewScrollDirection(directionInput);
        if (!direction) return { ok: false, message: "I couldn't use that preview scroll direction." };
        const scroller = previewScrollerRef.current;
        if (!scroller) {
          return {
            ok: false,
            message: "I can open and close this preview, but I can't scroll inside that external iframe.",
          };
        }
        return scroller(direction)
          ? { ok: true, message: `Scrolling the project preview ${direction}.` }
          : { ok: false, message: "I couldn't scroll this preview right now." };
      }, 'preview');
    },
    [browser, runWithControlOverlay],
  );

  const openCurrentProjectExternal = useCallback((): ControlResult => {
    return runWithControlOverlay(() => {
      if (!browser) return { ok: false, message: 'There is no project browser open right now.' };
      window.open(browser.url, '_blank', 'noopener,noreferrer');
      return { ok: true, message: 'Opening the current project in a new tab.' };
    });
  }, [browser, runWithControlOverlay]);

  const unsupportedIframeControl = useCallback(
    (): ControlResult => runWithControlOverlay(() => ({
      ok: false,
      message: "I can control the portfolio shell, but I can't operate arbitrary controls inside a third-party iframe.",
    })),
    [runWithControlOverlay]
  );

  const registerAboutScroller = useCallback((scroller: ((section: ControlSection) => void) | null) => {
    aboutScrollerRef.current = scroller;

    if (scroller && pendingSectionRef.current) {
      const pending = pendingSectionRef.current;
      pendingSectionRef.current = null;
      window.setTimeout(() => scroller(pending), 100);
    }

    return () => {
      if (aboutScrollerRef.current === scroller) aboutScrollerRef.current = null;
    };
  }, []);

  const registerPreviewScroller = useCallback((scroller: PreviewScroller | null) => {
    previewScrollerRef.current = scroller;
  }, []);

  const value: SiteControlContextType = useMemo(() => ({
    navigate,
    openProject,
    scrollTo,
    scrollProjectPreview,
    closeBrowser,
    openCurrentProjectExternal,
    unsupportedIframeControl,
    registerAboutScroller,
  }), [
    closeBrowser,
    navigate,
    openCurrentProjectExternal,
    openProject,
    registerAboutScroller,
    scrollTo,
    scrollProjectPreview,
    unsupportedIframeControl,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    window.__parzSiteControl = value;
    return () => {
      if (window.__parzSiteControl === value) delete window.__parzSiteControl;
    };
  }, [value]);

  return (
    <SiteControlContext.Provider value={value}>
      {children}
      <FsbControlOverlay active={controlOverlayActive} />
      {browser && (
        <IframeViewer
          url={browser.url}
          label={`${browser.projectName} · ${browser.label}`}
          isDark={resolvedTheme === 'dark'}
          controlOverlayActive={controlOverlayActive && controlOverlayScope === 'preview'}
          onClose={() => {
            previewScrollerRef.current = null;
            setBrowser(null);
          }}
          onRegisterPreviewScroller={registerPreviewScroller}
        />
      )}
    </SiteControlContext.Provider>
  );
}
