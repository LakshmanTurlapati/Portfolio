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
import { isApprovedExternalLink } from '@/lib/approved-links';
import {
  controlPageFromPathname,
  type ControlPage,
} from '@/lib/portfolio-concierge';
import {
  normalizePreviewScrollDirection,
  normalizeSection,
  type ControlSection,
  type PreviewScrollDirection,
  type PreviewScroller,
} from '@/lib/site-control-utils';
import { useTransition } from '@/providers/transition-provider';

interface ControlResult {
  ok: boolean;
  message: string;
}

interface BrowserState {
  url: string;
  label: string;
  projectName: string;
}

interface SiteControlContextType {
  page: ControlPage;
  browserOpen: boolean;
  previewScrollable: boolean;
  navigate: (page: ControlPage) => ControlResult;
  openProject: (input: string) => ControlResult;
  scrollTo: (section: ControlSection | string) => ControlResult;
  scrollProjectPreview: (direction?: PreviewScrollDirection | string) => ControlResult;
  closeBrowser: () => ControlResult;
  openCurrentProjectExternal: () => ControlResult;
  unsupportedIframeControl: () => ControlResult;
  toggleTheme: () => ControlResult;
  openLink: (url: string) => ControlResult;
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
  const { resolvedTheme, setTheme } = useTheme();
  const { navigateWithReveal } = useTransition();
  const [browser, setBrowser] = useState<BrowserState | null>(null);
  const [previewScrollable, setPreviewScrollable] = useState(false);
  const aboutScrollerRef = useRef<((section: ControlSection) => void) | null>(null);
  const previewScrollerRef = useRef<PreviewScroller | null>(null);
  const pendingSectionRef = useRef<ControlSection | null>(null);
  const navigate = useCallback(
    (page: ControlPage): ControlResult => {
      const path = PAGE_PATHS[page];
      if (pathname === path) {
        return { ok: true, message: `Already on ${page}.` };
      }

      navigateWithReveal(path, window.innerWidth / 2, window.innerHeight / 2);
      return { ok: true, message: `Heading to ${page}.` };
    },
    [navigateWithReveal, pathname]
  );

  const openProject = useCallback((input: string): ControlResult => {
    const project = resolveProject(input);
    const target = project ? getProjectBrowserTarget(project) : null;

    if (!project || !target) {
      return { ok: false, message: "I couldn't find an approved project target for that." };
    }

    previewScrollerRef.current = null;
    setPreviewScrollable(false);
    setBrowser({ ...target, projectName: project.name });
    return { ok: true, message: `Opening ${project.name}.` };
  }, []);

  const scrollTo = useCallback(
    (sectionInput: ControlSection | string): ControlResult => {
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
    },
    [navigateWithReveal, pathname]
  );

  const closeBrowser = useCallback((): ControlResult => {
    if (!browser) return { ok: false, message: 'There is no project browser open right now.' };
    previewScrollerRef.current = null;
    setPreviewScrollable(false);
    setBrowser(null);
    return { ok: true, message: 'Closing the browser view.' };
  }, [browser]);

  const scrollProjectPreview = useCallback(
    (directionInput: PreviewScrollDirection | string = 'down'): ControlResult => {
      if (!browser) return { ok: false, message: 'There is no project browser open right now.' };
      const direction = normalizePreviewScrollDirection(directionInput);
      if (!direction) return { ok: false, message: "I couldn't use that preview scroll direction." };
      const scroller = previewScrollerRef.current;
      if (!scroller) {
        return {
          ok: false,
          message: "I can open and close this preview, but this one doesn't support direct scrolling.",
        };
      }
      return scroller(direction)
        ? { ok: true, message: 'Showing more of this project.' }
        : { ok: false, message: "I couldn't scroll this preview right now." };
    },
    [browser],
  );

  const openCurrentProjectExternal = useCallback((): ControlResult => {
    if (!browser) return { ok: false, message: 'There is no project browser open right now.' };
    window.open(browser.url, '_blank', 'noopener,noreferrer');
    return { ok: true, message: 'Opening the current project in a new tab.' };
  }, [browser]);

  const unsupportedIframeControl = useCallback((): ControlResult => ({
    ok: false,
    message: "I can move around the portfolio, but I can't operate that embedded site directly.",
  }), []);

  const toggleTheme = useCallback((): ControlResult => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    return { ok: true, message: 'Switching the theme.' };
  }, [resolvedTheme, setTheme]);

  const openLink = useCallback((url: string): ControlResult => {
    if (!isApprovedExternalLink(url)) {
      return { ok: false, message: "I can't open that link from voice mode." };
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return { ok: true, message: 'Opening the approved link.' };
  }, []);

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
    setPreviewScrollable(scroller !== null);
  }, []);

  const value: SiteControlContextType = useMemo(() => ({
    page: controlPageFromPathname(pathname),
    browserOpen: browser !== null,
    previewScrollable,
    navigate,
    openProject,
    scrollTo,
    scrollProjectPreview,
    closeBrowser,
    openCurrentProjectExternal,
    unsupportedIframeControl,
    toggleTheme,
    openLink,
    registerAboutScroller,
  }), [
    browser,
    closeBrowser,
    navigate,
    openCurrentProjectExternal,
    openLink,
    openProject,
    pathname,
    previewScrollable,
    registerAboutScroller,
    scrollTo,
    scrollProjectPreview,
    toggleTheme,
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
      <FsbControlOverlay />
      {browser && (
        <IframeViewer
          url={browser.url}
          label={`${browser.projectName} · ${browser.label}`}
          isDark={resolvedTheme === 'dark'}
          onClose={() => {
            previewScrollerRef.current = null;
            setPreviewScrollable(false);
            setBrowser(null);
          }}
          onRegisterPreviewScroller={registerPreviewScroller}
        />
      )}
    </SiteControlContext.Provider>
  );
}
