'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { FaXmark, FaArrowUpRightFromSquare, FaLink, FaFigma, FaGithub } from 'react-icons/fa6';
import { GithubPreview } from './github-preview';

type ViewerKind = 'figma' | 'github' | 'web';

function detectKind(url: string): ViewerKind {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('figma.com')) return 'figma';
    if (h.includes('github.com') || h.includes('githubusercontent.com')) return 'github';
    return 'web';
  } catch { return 'web'; }
}

const UNEMBEDDABLE_HOSTS = [
  'github.com', 'githubusercontent.com', 'chromewebstore.google.com',
  'chrome.google.com', 'docs.google.com', 'linkedin.com',
  'youtube.com', 'youtu.be',
];

export function isUnembeddable(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return UNEMBEDDABLE_HOSTS.some((bad) => h === bad || h.endsWith('.' + bad));
  } catch { return false; }
}

function buildEmbedUrl(url: string, kind: ViewerKind): string {
  if (kind === 'figma') {
    return 'https://www.figma.com/embed?embed_host=share&url=' + encodeURIComponent(url);
  }
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase().replace(/^www\./, '');
    if (h === 'youtube.com' && u.pathname === '/watch') {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (h === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch { /* ignore */ }
  return url;
}

interface IframeViewerProps {
  url: string;
  label?: string;
  isDark: boolean;
  onClose: () => void;
}

export function IframeViewer({ url, label, isDark, onClose }: IframeViewerProps) {
  const kind = useMemo(() => detectKind(url), [url]);
  const unembeddable = useMemo(() => isUnembeddable(url) && kind !== 'figma', [url, kind]);
  const embedUrl = useMemo(() => buildEmbedUrl(url, kind), [url, kind]);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(unembeddable);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      if (loadTimer.current) clearTimeout(loadTimer.current);
    };
  }, [onClose]);

  useEffect(() => {
    if (unembeddable) return;
    loadTimer.current = setTimeout(() => { setBlocked(true); }, 8000);
    return () => { if (loadTimer.current) clearTimeout(loadTimer.current); };
  }, [unembeddable]);

  const hostname = useMemo(() => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  }, [url]);

  const IconClass = kind === 'figma' ? FaFigma : kind === 'github' ? FaGithub : FaLink;

  return (
    <div
      className="fixed inset-0 z-[100]"
      onClick={onClose}
      style={{
        background: isDark ? 'rgba(250,249,245,0.55)' : 'rgba(10,10,12,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="absolute inset-4 sm:inset-8 rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#fafaf7' : '#1a1a1c',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
      >
        {/* Chrome bar */}
        <header
          className="flex items-center justify-between px-4 h-12 shrink-0"
          style={{ borderBottom: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}
        >
          <div className="flex items-center gap-2 text-sm opacity-70" style={{ color: isDark ? '#1a1a1a' : '#f3f2ee' }}>
            <IconClass />
            <span className="font-medium">{hostname}</span>
            {label && <span className="opacity-50">&middot; {label}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 rounded-lg grid place-items-center text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: isDark ? '#1a1a1a' : '#f3f2ee' }}
              onClick={() => window.open(url, '_blank')}
              title="Open in new tab"
            >
              <FaArrowUpRightFromSquare />
            </button>
            <button
              className="w-8 h-8 rounded-lg grid place-items-center text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: isDark ? '#1a1a1a' : '#f3f2ee' }}
              onClick={onClose}
              title="Close (Esc)"
            >
              <FaXmark />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 relative" style={{ color: isDark ? '#1a1a1a' : '#f3f2ee' }}>
          {unembeddable ? (
            kind === 'github' ? (
              <GithubPreview url={url} isDark={isDark} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <IconClass className="text-5xl opacity-30" />
                <h3 className="text-xl font-bold">{hostname} can&apos;t be embedded</h3>
                <p className="text-sm opacity-60 max-w-md">This site blocks iframe embedding for security. Open it in a new tab to continue.</p>
                <button
                  className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
                  style={{
                    background: isDark ? '#1a1a1a' : '#f3f2ee',
                    color: isDark ? '#fff' : '#1a1a1a',
                  }}
                  onClick={() => window.open(url, '_blank')}
                >
                  <FaArrowUpRightFromSquare /> Open in new tab
                </button>
              </div>
            )
          ) : (
            <>
              {!loaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
                  <div className="text-sm opacity-40">Loading {hostname}...</div>
                </div>
              )}
              <iframe
                src={embedUrl}
                title={label || hostname}
                className="absolute inset-0 w-full h-full border-0 transition-opacity duration-300"
                style={{ opacity: loaded ? 1 : 0 }}
                onLoad={() => {
                  setLoaded(true);
                  setBlocked(false);
                  if (loadTimer.current) clearTimeout(loadTimer.current);
                }}
                allow="fullscreen; clipboard-read; clipboard-write"
                referrerPolicy="no-referrer"
              />
              {blocked && !loaded && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 p-3 rounded-xl text-sm"
                  style={{
                    background: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div>
                    <strong>Having trouble loading?</strong>
                    <div className="opacity-60 text-xs mt-0.5">This site may block embedding. Try opening it in a new tab.</div>
                  </div>
                  <button
                    className="ml-auto shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: isDark ? '#1a1a1a' : '#f3f2ee',
                      color: isDark ? '#fff' : '#1a1a1a',
                    }}
                    onClick={() => window.open(url, '_blank')}
                  >
                    Open
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
