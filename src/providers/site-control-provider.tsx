'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { FsbControlOverlay } from '@/components/fsb-control-overlay';
import { IframeViewer } from '@/components/iframe-viewer';
import { getProjectBrowserTarget, resolveProject } from '@/data/projects';
import { useTransition } from '@/providers/transition-provider';

export type ControlPage = 'home' | 'portfolio' | 'about';
export type ControlSection = 'about' | 'experience' | 'academics';

export interface ControlResult {
  ok: boolean;
  message: string;
}

interface BrowserState {
  url: string;
  label: string;
  projectName: string;
}

interface SiteControlContextType {
  navigate: (page: ControlPage) => ControlResult;
  openProject: (input: string) => ControlResult;
  scrollTo: (section: ControlSection | string) => ControlResult;
  closeBrowser: () => ControlResult;
  openCurrentProjectExternal: () => ControlResult;
  unsupportedIframeControl: () => ControlResult;
  registerAboutScroller: (scroller: ((section: ControlSection) => void) | null) => () => void;
}

const SiteControlContext = createContext<SiteControlContextType | null>(null);

const PAGE_PATHS: Record<ControlPage, string> = {
  home: '/',
  portfolio: '/portfolio',
  about: '/about',
};

const SECTION_ALIASES: Record<string, ControlSection> = {
  about: 'about',
  bio: 'about',
  me: 'about',
  experience: 'experience',
  work: 'experience',
  academics: 'academics',
  academic: 'academics',
  education: 'academics',
  school: 'academics',
};

function normalizeSection(section: ControlSection | string): ControlSection | null {
  return SECTION_ALIASES[section.replace(/^#/, '').toLowerCase()] || null;
}

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
  const aboutScrollerRef = useRef<((section: ControlSection) => void) | null>(null);
  const pendingSectionRef = useRef<ControlSection | null>(null);
  const overlayHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (overlayHideTimerRef.current) window.clearTimeout(overlayHideTimerRef.current);
    };
  }, []);

  const runWithControlOverlay = useCallback((action: () => ControlResult): ControlResult => {
    if (overlayHideTimerRef.current) window.clearTimeout(overlayHideTimerRef.current);
    setControlOverlayActive(true);

    try {
      return action();
    } finally {
      overlayHideTimerRef.current = window.setTimeout(() => {
        setControlOverlayActive(false);
        overlayHideTimerRef.current = null;
      }, 900);
    }
  }, []);

  const navigate = useCallback(
    (page: ControlPage): ControlResult => {
      return runWithControlOverlay(() => {
        navigateWithReveal(PAGE_PATHS[page], window.innerWidth / 2, window.innerHeight / 2);
        return { ok: true, message: `Heading to ${page}.` };
      });
    },
    [navigateWithReveal, runWithControlOverlay]
  );

  const openProject = useCallback((input: string): ControlResult => {
    return runWithControlOverlay(() => {
      const project = resolveProject(input);
      const target = project ? getProjectBrowserTarget(project) : null;

      if (!project || !target) {
        return { ok: false, message: "I couldn't find an approved project target for that." };
      }

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
      setBrowser(null);
      return { ok: true, message: 'Closing the browser view.' };
    });
  }, [browser, runWithControlOverlay]);

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

  const value: SiteControlContextType = {
    navigate,
    openProject,
    scrollTo,
    closeBrowser,
    openCurrentProjectExternal,
    unsupportedIframeControl,
    registerAboutScroller,
  };

  return (
    <SiteControlContext.Provider value={value}>
      {children}
      <FsbControlOverlay active={controlOverlayActive} />
      {browser && (
        <IframeViewer
          url={browser.url}
          label={`${browser.projectName} · ${browser.label}`}
          isDark={resolvedTheme === 'dark'}
          onClose={() => setBrowser(null)}
        />
      )}
    </SiteControlContext.Provider>
  );
}
