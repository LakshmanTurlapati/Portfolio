'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaGithub,
  FaArrowUpRightFromSquare,
  FaCode,
  FaCodeBranch,
  FaCodeFork,
  FaCodePullRequest,
  FaPlay,
  FaShieldHalved,
  FaChartBar,
  FaCircleDot,
  FaAngleDown,
  FaClockRotateLeft,
  FaEye,
  FaStar,
  FaBook,
  FaLink,
  FaFolderOpen,
  FaFileLines,
  FaFolder,
  FaFile,
} from 'react-icons/fa6';
import type { PreviewScroller } from '@/lib/site-control-utils';
import { openExternalUrl } from '@/lib/open-external';

// ===== Helpers =====

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parts = new URL(url).pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
  } catch {}
  return null;
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'today';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)}mo ago`;
    return `${Math.round(diffDays / 365)}y ago`;
  } catch { return ''; }
}

function isAbsoluteUrl(url: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url);
}

function cleanRelativePath(path: string): string {
  return path.replace(/^\.\//, '').replace(/^\/+/, '');
}

function buildRawUrl(path: string, rawBase: string): string {
  return rawBase + cleanRelativePath(path);
}

function buildBlobUrl(path: string, blobBase: string): string {
  return blobBase + cleanRelativePath(path);
}

function rewriteRelativeUrls(html: string, rawBase: string, blobBase: string): string {
  if (!html) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return html;

  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!isAbsoluteUrl(src)) img.setAttribute('src', buildRawUrl(src, rawBase));
    img.setAttribute('loading', 'lazy');
  });

  root.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') || '';
    if (!isAbsoluteUrl(href) && !href.startsWith('mailto:')) {
      anchor.setAttribute('href', buildBlobUrl(href, blobBase));
    }
    if (!href.startsWith('#')) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  });

  root
    .querySelectorAll<HTMLElement>('section[data-type="mermaid"], .js-render-needs-enrichment[data-type="mermaid"]')
    .forEach((section, index) => {
      const source =
        section.querySelector<HTMLElement>('[data-plain]')?.getAttribute('data-plain') ||
        section.querySelector('pre[lang="mermaid"]')?.textContent ||
        '';
      if (!source.trim()) return;
      section.replaceWith(createMermaidBlock(doc, source, index));
    });

  root
    .querySelectorAll<HTMLElement>('pre[lang="mermaid"], pre > code.language-mermaid')
    .forEach((node, index) => {
      const pre = node.tagName.toLowerCase() === 'pre' ? node : node.closest('pre');
      if (!pre || pre.closest('.ghx-mermaid-block')) return;
      const source = node.textContent || '';
      if (!source.trim()) return;
      pre.replaceWith(createMermaidBlock(doc, source, index));
    });

  return root.innerHTML;
}

function createMermaidBlock(doc: Document, source: string, index: number): HTMLElement {
  const block = doc.createElement('div');
  block.className = 'ghx-mermaid-block';

  const diagram = doc.createElement('pre');
  diagram.className = 'mermaid ghx-mermaid-diagram';
  diagram.setAttribute('data-ghx-mermaid', String(index));
  diagram.textContent = source;
  block.appendChild(diagram);

  const details = doc.createElement('details');
  details.className = 'ghx-mermaid-source';
  const summary = doc.createElement('summary');
  summary.textContent = 'Mermaid source';
  const code = doc.createElement('code');
  code.textContent = source;
  details.append(summary, code);
  block.appendChild(details);

  return block;
}

const LANG_SHADES = ['#e5e5e5', '#c9c9c9', '#9e9e9e', '#777777', '#505050', '#2e2e2e'];

// ===== Types =====

interface RepoData {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  subscribers_count: number;
  open_issues_count: number;
  pushed_at: string;
  topics: string[];
  license: { spdx_id: string; name: string } | null;
  owner: {
    login: string;
    html_url: string;
    avatar_url: string;
  };
}

interface Contributor {
  login: string;
  html_url: string;
  avatar_url: string;
  contributions: number;
}

interface LangMap {
  [name: string]: number;
}

interface RepoContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size?: number;
  html_url: string | null;
}

interface GithubPreviewCacheEntry {
  repo: RepoData;
  readmeHtml: string;
  contributors: Contributor[];
  langs: LangMap;
  contents: RepoContentItem[];
  hasMermaid: boolean;
}

const previewCache = new Map<string, GithubPreviewCacheEntry>();

// ===== Component =====

export interface GithubPreviewProps {
  url: string;
  isDark: boolean;
  onRegisterScroller?: (scroller: PreviewScroller | null) => void;
}

export function GithubPreview({ url, isDark, onRegisterScroller }: GithubPreviewProps) {
  const parsed = useMemo(() => parseGithubUrl(url), [url]);
  const [repo, setRepo] = useState<RepoData | null>(null);
  const [readmeHtml, setReadmeHtml] = useState('');
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [langs, setLangs] = useState<LangMap | null>(null);
  const [contents, setContents] = useState<RepoContentItem[]>([]);
  const [hasMermaid, setHasMermaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mdRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parsed) {
      setError('Not a valid GitHub URL');
      setLoading(false);
      return;
    }
    let cancel = false;
    const { owner, repo: name } = parsed;
    setLoading(true);
    setError(null);
    setRepo(null);
    setReadmeHtml('');
    setContributors([]);
    setLangs(null);
    setContents([]);
    setHasMermaid(false);

    const cacheKey = `${owner}/${name}`.toLowerCase();
    const cached = previewCache.get(cacheKey);
    if (cached) {
      setRepo(cached.repo);
      setReadmeHtml(cached.readmeHtml);
      setContributors(cached.contributors);
      setLangs(cached.langs);
      setContents(cached.contents);
      setHasMermaid(cached.hasMermaid);
      setLoading(false);
      return;
    }

    const base = `https://api.github.com/repos/${owner}/${name}`;
    const branchOfRepo = (r: RepoData) => r?.default_branch || 'main';
    const rawBase = (branch: string) => `https://raw.githubusercontent.com/${owner}/${name}/${branch}/`;
    const blobBase = (branch: string) => `https://github.com/${owner}/${name}/blob/${branch}/`;

    async function load() {
      try {
        const repoRes = await fetch(base);
        if (!repoRes.ok) throw repoRes.status;
        const repoData: RepoData = await repoRes.json();
        if (cancel) return;
        setRepo(repoData);

        const branch = branchOfRepo(repoData);

        const [readmeRaw, contribData, langsData, contentsData] = await Promise.all([
          fetch(`${base}/readme`, { headers: { Accept: 'application/vnd.github.raw' } }).then(r => r.ok ? r.text() : ''),
          fetch(`${base}/contributors?per_page=8`).then(r => r.ok ? r.json() : []),
          fetch(`${base}/languages`).then(r => r.ok ? r.json() : {}),
          fetch(`${base}/contents?ref=${encodeURIComponent(branch)}`, { headers: { Accept: 'application/vnd.github+json' } }).then(r => r.ok ? r.json() : []),
        ]);
        if (cancel) return;
        const safeContributors = Array.isArray(contribData) ? contribData : [];
        const safeLangs = langsData || {};
        const safeContents = Array.isArray(contentsData)
          ? contentsData
              .filter((item): item is RepoContentItem => typeof item?.name === 'string' && typeof item?.type === 'string')
              .sort((a, b) => {
                if (a.type === 'dir' && b.type !== 'dir') return -1;
                if (a.type !== 'dir' && b.type === 'dir') return 1;
                return a.name.localeCompare(b.name);
              })
          : [];
        setContributors(safeContributors);
        setLangs(safeLangs);
        setContents(safeContents);

        let html = '';
        if (readmeRaw) {
          try {
            const mdRes = await fetch('https://api.github.com/markdown', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/vnd.github.html',
              },
              body: JSON.stringify({ text: readmeRaw, mode: 'gfm', context: `${owner}/${name}` }),
            });
            if (mdRes.ok) html = await mdRes.text();
          } catch {}
          html = rewriteRelativeUrls(html, rawBase(branch), blobBase(branch));
        }
        if (cancel) return;
        const hasMermaidBlocks = html.includes('ghx-mermaid-block');
        previewCache.set(cacheKey, {
          repo: repoData,
          readmeHtml: html,
          contributors: safeContributors,
          langs: safeLangs,
          contents: safeContents,
          hasMermaid: hasMermaidBlocks,
        });
        setReadmeHtml(html);
        setHasMermaid(hasMermaidBlocks);
        setLoading(false);
      } catch (err) {
        if (cancel) return;
        setError(
          err === 403
            ? 'GitHub API rate limit reached'
            : err === 404
            ? 'Repository not found'
            : "Couldn't load repo data"
        );
        setLoading(false);
      }
    }

    load();
    return () => { cancel = true; };
  }, [parsed?.owner, parsed?.repo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasMermaid || !readmeHtml || !mdRef.current) return;
    let cancel = false;

    async function renderMermaid() {
      const nodes = Array.from(mdRef.current?.querySelectorAll<HTMLElement>('.ghx-mermaid-diagram') || []);
      if (nodes.length === 0) return;
      try {
        const mermaid = (await import('mermaid')).default;
        if (cancel) return;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDark ? 'dark' : 'default',
          fontFamily: '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        });
        await mermaid.run({ nodes, suppressErrors: true });
      } catch {
        // Leave the readable source fallback visible if Mermaid cannot render.
      }
    }

    renderMermaid();
    return () => { cancel = true; };
  }, [hasMermaid, isDark, readmeHtml]);

  useEffect(() => {
    if (!onRegisterScroller) return;
    if (loading || error || !repo) {
      onRegisterScroller(null);
      return;
    }

    const scroller: PreviewScroller = (direction) => {
      const shell = shellRef.current;
      if (!shell) return false;
      const distance = Math.max(360, Math.floor(shell.clientHeight * 0.75));
      const top =
        direction === 'top'
          ? 0
          : direction === 'bottom'
            ? shell.scrollHeight
            : direction === 'up'
              ? shell.scrollTop - distance
              : shell.scrollTop + distance;
      shell.scrollTo({ top, behavior: 'smooth' });
      return true;
    };

    onRegisterScroller(scroller);
    return () => onRegisterScroller(null);
  }, [error, loading, onRegisterScroller, repo]);

  // T-05-02 mitigated: content originates from GitHub's markdown API (server-sanitized).
  // Relative URLs rewritten to absolute before injection; external links get target="_blank" rel="noopener".

  // ===== Color palette =====
  const bg = isDark ? '#0d1117' : '#ffffff';
  const fg = isDark ? '#e6edf3' : '#1f2328';
  const border = isDark ? '#30363d' : '#d1d9e0';
  const mutedFg = isDark ? '#9198a1' : '#59636e';
  const subtleBg = isDark ? '#f6f8fa14' : '#f6f8fa';
  const btnBg = isDark ? '#212830' : '#f6f8fa';
  const btnBorder = isDark ? '#3d444d' : '#d1d9e0';
  const countBg = isDark ? '#1f242c' : '#eff2f5';
  const linkColor = isDark ? '#4493f8' : '#0969da';
  const readmeCardBg = isDark ? '#0d1117' : '#ffffff';
  const readmeHdBg = isDark ? '#151b23' : '#f6f8fa';
  const sideSectionBorder = isDark ? '#30363d' : '#d1d9e0';

  // ===== Loading state =====
  if (loading) {
    return (
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: bg, color: fg,
          fontFamily: '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: 32, height: 32,
            border: `2px solid ${fg}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            opacity: 0.4,
          }}
        />
        <div style={{ fontSize: 14, opacity: 0.6 }}>
          Loading {parsed?.owner}/{parsed?.repo}&hellip;
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ===== Error state =====
  if (error || !repo) {
    return (
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          textAlign: 'center', padding: '0 32px',
          background: bg, color: fg,
          fontFamily: '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <FaGithub style={{ fontSize: 48, opacity: 0.45 }} />
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{error || "Couldn't load repo"}</h3>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.6, maxWidth: 360 }}>
          GitHub can&apos;t be embedded directly. Open it in a new tab to browse the full repo.
        </p>
        <button
          style={{
            marginTop: 8,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: isDark ? '#238636' : '#1f883d', color: '#fff',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
          onClick={() => openExternalUrl(url)}
        >
          <FaArrowUpRightFromSquare /> Open on GitHub
        </button>
      </div>
    );
  }

  // ===== Loaded state =====
  const totalLangBytes = langs ? Object.values(langs).reduce((a, b) => a + b, 0) : 0;
  const topLangs = langs
    ? Object.entries(langs)
        .map(([lname, bytes]) => ({ name: lname, pct: totalLangBytes ? (bytes / totalLangBytes) * 100 : 0, bytes }))
        .sort((a, b) => b.bytes - a.bytes)
    : [];
  const branch = repo.default_branch || 'main';
  const displayedContents = contents.slice(0, 12);

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
    padding: '5px 12px',
    background: btnBg, color: fg,
    border: `1px solid ${btnBorder}`,
    borderRadius: 6, cursor: 'pointer',
    transition: 'background 80ms ease',
  };

  const tabStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, padding: '8px 10px 10px',
    textDecoration: 'none', color: fg,
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
    borderRadius: '6px 6px 0 0',
    marginRight: 2, fontWeight: 400,
  };

  const activeTabStyle: React.CSSProperties = {
    ...tabStyle,
    borderBottom: '2px solid #fd8c73',
    fontWeight: 600,
  };

  return (
    <div
      ref={shellRef}
      style={{
        position: 'absolute', inset: 0,
        overflowY: 'auto',
        background: bg, color: fg,
        fontFamily: '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        fontSize: 14, lineHeight: 1.5,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* GitHub-like header */}
      <div
        style={{
          padding: '16px 24px 0',
          borderBottom: `1px solid ${border}`,
          background: bg,
          position: 'sticky', top: 0, zIndex: 4,
        }}
      >
        {/* Header inner */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 16,
            flexWrap: 'wrap', paddingBottom: 12,
          }}
        >
          {/* Path breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 20, fontWeight: 600, flexWrap: 'wrap' }}>
            <FaFolderOpen style={{ fontSize: 16, color: mutedFg, marginRight: 4 }} />
            <a
              href={`https://github.com/${repo.owner.login}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: linkColor, textDecoration: 'none', fontWeight: 400 }}
            >
              {repo.owner.login}
            </a>
            <span style={{ color: mutedFg, fontWeight: 300, margin: '0 2px' }}>/</span>
            <a
              href={repo.html_url}
              target="_blank" rel="noopener noreferrer"
              style={{ color: linkColor, textDecoration: 'none', fontWeight: 600 }}
            >
              {repo.name}
            </a>
            <span
              style={{
                fontSize: 12, fontWeight: 500,
                padding: '2px 7px', border: `1px solid ${border}`,
                borderRadius: 999, color: mutedFg, marginLeft: 8,
              }}
            >
              {repo.private ? 'Private' : 'Public'}
            </span>
            {repo.fork && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: subtleBg, border: `1px solid ${border}`, color: mutedFg, marginLeft: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                fork
              </span>
            )}
            {repo.archived && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: isDark ? '#332b00' : '#fff8c5', border: `1px solid ${isDark ? '#4d3c00' : '#eac54f'}`, color: isDark ? '#e3b341' : '#633c01', marginLeft: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                archived
              </span>
            )}
          </div>

          {/* Actions: Watch / Fork / Star */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={btnStyle} onClick={() => openExternalUrl(repo.html_url + '/watchers')}>
              <FaEye style={{ fontSize: 12 }} /> Watch
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', marginLeft: 2, background: countBg, borderRadius: 10 }}>
                {formatNum(repo.subscribers_count || repo.watchers_count)}
              </span>
            </button>
            <button style={btnStyle} onClick={() => openExternalUrl(repo.html_url + '/forks')}>
              <FaCodeFork style={{ fontSize: 12 }} /> Fork
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', marginLeft: 2, background: countBg, borderRadius: 10 }}>
                {formatNum(repo.forks_count)}
              </span>
            </button>
            <button style={btnStyle} onClick={() => openExternalUrl(repo.html_url + '/stargazers')}>
              <FaStar style={{ fontSize: 12 }} /> Star
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', marginLeft: 2, background: countBg, borderRadius: 10 }}>
                {formatNum(repo.stargazers_count)}
              </span>
            </button>
          </div>
        </div>

        {/* Subnav tabs */}
        <nav style={{ display: 'flex', overflowX: 'auto', padding: '0 0px', margin: '0 -24px', paddingLeft: 24 }}>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={activeTabStyle}>
            <FaCode style={{ fontSize: 14, color: mutedFg }} /> Code
          </a>
          <a href={repo.html_url + '/issues'} target="_blank" rel="noopener noreferrer" style={tabStyle}>
            <FaCircleDot style={{ fontSize: 14, color: mutedFg }} /> Issues
            <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 10, background: countBg, color: fg }}>
              {formatNum(repo.open_issues_count)}
            </span>
          </a>
          <a href={repo.html_url + '/pulls'} target="_blank" rel="noopener noreferrer" style={tabStyle}>
            <FaCodePullRequest style={{ fontSize: 14, color: mutedFg }} /> Pull requests
          </a>
          <a href={repo.html_url + '/actions'} target="_blank" rel="noopener noreferrer" style={tabStyle}>
            <FaPlay style={{ fontSize: 14, color: mutedFg }} /> Actions
          </a>
          <a href={repo.html_url + '/security'} target="_blank" rel="noopener noreferrer" style={tabStyle}>
            <FaShieldHalved style={{ fontSize: 14, color: mutedFg }} /> Security
          </a>
          <a href={repo.html_url + '/pulse'} target="_blank" rel="noopener noreferrer" style={tabStyle}>
            <FaChartBar style={{ fontSize: 14, color: mutedFg }} /> Insights
          </a>
        </nav>
      </div>

      {/* Main grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 296px',
          gap: 24, padding: 24,
          maxWidth: 1280, margin: '0 auto',
          alignItems: 'start',
        }}
        className="ghx-responsive-grid"
      >
        {/* Content column */}
        <div style={{ minWidth: 0 }}>
          {/* Branch bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, flexWrap: 'wrap' }}>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'inherit', fontSize: 13,
                padding: '5px 12px',
                background: btnBg, color: fg,
                border: `1px solid ${btnBorder}`,
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              <FaCodeBranch style={{ color: mutedFg }} />
              <strong>{branch}</strong>
              <FaAngleDown style={{ fontSize: 10, opacity: 0.5 }} />
            </button>
            <span style={{ fontSize: 12, color: mutedFg, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FaClockRotateLeft /> Updated {formatDate(repo.pushed_at)}
            </span>
            <a
              href={repo.html_url}
              target="_blank" rel="noopener noreferrer"
              style={{
                marginLeft: 'auto',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, textDecoration: 'none',
                padding: '5px 12px',
                background: '#1f883d', color: '#ffffff',
                border: '1px solid rgba(31,136,61,0.6)',
                borderRadius: 6, fontWeight: 500,
              }}
            >
              <FaArrowUpRightFromSquare /> Open on GitHub
            </a>
          </div>

          {displayedContents.length > 0 && (
            <div
              style={{
                border: `1px solid ${border}`,
                borderRadius: 6,
                background: readmeCardBg,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px',
                  background: readmeHdBg,
                  borderBottom: `1px solid ${border}`,
                  color: mutedFg,
                  fontSize: 13,
                }}
              >
                <FaCodeBranch />
                <strong style={{ color: fg }}>{branch}</strong>
                <span style={{ marginLeft: 'auto' }}>{contents.length} root items</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {displayedContents.map((item) => (
                  <a
                    key={item.path}
                    href={item.html_url || `${repo.html_url}/tree/${branch}/${item.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px minmax(0, 1fr) auto',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 38,
                      padding: '8px 16px',
                      borderBottom: `1px solid ${border}`,
                      color: fg,
                      textDecoration: 'none',
                      fontSize: 14,
                    }}
                  >
                    {item.type === 'dir' ? (
                      <FaFolder style={{ color: linkColor }} />
                    ) : (
                      <FaFile style={{ color: mutedFg }} />
                    )}
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: item.type === 'dir' ? 600 : 400 }}>
                      {item.name}
                    </span>
                    <span style={{ color: mutedFg, fontSize: 12 }}>
                      {item.type === 'file' && typeof item.size === 'number' ? formatFileSize(item.size) : item.type}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* README card */}
          <div
            style={{
              border: `1px solid ${border}`,
              borderRadius: 6,
              background: readmeCardBg,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                background: readmeHdBg,
                borderBottom: `1px solid ${border}`,
                fontSize: 13, fontWeight: 600,
              }}
            >
              <FaFileLines style={{ color: mutedFg }} />
              <span>README.md</span>
            </div>
            {readmeHtml ? (
              <div
                ref={mdRef}
                className="ghx-md-readme"
                style={{ padding: 32, fontSize: 16, lineHeight: 1.5, color: fg, wordWrap: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: readmeHtml }}
              />
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: mutedFg }}>
                <p style={{ margin: 0 }}>No README available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 14 }}>
          {/* About section */}
          <section style={{ paddingBottom: 16, borderBottom: `1px solid ${sideSectionBorder}` }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: fg, display: 'flex', alignItems: 'center', gap: 8 }}>
              About
            </h4>
            {repo.description && (
              <p style={{ margin: '0 0 12px', color: fg, fontSize: 14, lineHeight: 1.5 }}>
                {repo.description}
              </p>
            )}
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: linkColor, textDecoration: 'none', marginBottom: 12, wordBreak: 'break-all' }}
              >
                <FaLink style={{ fontSize: 12, color: mutedFg }} />
                {repo.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {repo.topics && repo.topics.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {repo.topics.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 12, fontWeight: 500,
                      padding: '3px 10px', borderRadius: 999,
                      background: isDark ? 'rgba(56,139,253,0.15)' : '#ddf4ff',
                      color: linkColor,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: mutedFg }}>
                <FaBook style={{ width: 16, textAlign: 'center', color: mutedFg }} />
                <a
                  href={repo.html_url + (repo.license ? '#license' : '')}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: mutedFg, textDecoration: 'none' }}
                >
                  {repo.license ? (repo.license.spdx_id || repo.license.name) + ' license' : 'No license'}
                </a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: mutedFg }}>
                <FaEye style={{ width: 16, textAlign: 'center', color: mutedFg }} />
                {formatNum(repo.subscribers_count || repo.watchers_count)} watching
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: mutedFg }}>
                <FaCodeFork style={{ width: 16, textAlign: 'center', color: mutedFg }} />
                {formatNum(repo.forks_count)} forks
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: mutedFg }}>
                <FaStar style={{ width: 16, textAlign: 'center', color: mutedFg }} />
                {formatNum(repo.stargazers_count)} stars
              </li>
            </ul>
          </section>

          {/* Contributors */}
          {contributors.length > 0 && (
            <section style={{ paddingBottom: 16, borderBottom: `1px solid ${sideSectionBorder}` }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: fg, display: 'flex', alignItems: 'center', gap: 8 }}>
                Contributors
                <span
                  style={{
                    fontSize: 12, fontWeight: 500,
                    padding: '1px 7px', borderRadius: 10,
                    background: isDark ? '#1f242c' : '#eff2f5',
                    color: mutedFg,
                  }}
                >
                  {contributors.length}
                </span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: 4 }}>
                {contributors.slice(0, 8).map((c) => (
                  <a
                    key={c.login}
                    href={c.html_url}
                    target="_blank" rel="noopener noreferrer"
                    title={`${c.login} — ${c.contributions} commits`}
                    style={{ display: 'block', width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', transition: 'transform 120ms ease' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.avatar_url}
                      alt={c.login}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {topLangs.length > 0 && (
            <section style={{ paddingBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: fg }}>Languages</h4>
              <div
                style={{
                  display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden',
                  background: isDark ? '#151b23' : '#eff2f5',
                  marginBottom: 12,
                  border: `2px solid ${bg}`,
                  boxSizing: 'content-box',
                }}
              >
                {topLangs.map((l, i) => (
                  <div
                    key={l.name}
                    style={{ height: '100%', width: l.pct + '%', background: LANG_SHADES[i % LANG_SHADES.length] }}
                    title={`${l.name} ${l.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topLangs.map((l, i) => (
                  <li key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span
                      style={{
                        width: 12, height: 12, borderRadius: '50%', display: 'inline-block',
                        background: LANG_SHADES[i % LANG_SHADES.length],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 600, color: fg }}>{l.name}</span>
                    <span style={{ color: mutedFg, marginLeft: 'auto' }}>{l.pct.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Responsive: collapse sidebar below content on narrow viewports */}
      <style>{`
        @media (max-width: 768px) {
          .ghx-responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .ghx-md-readme a:hover { text-decoration: underline; }
        .ghx-md-readme > :first-child { margin-top: 0 !important; }
        .ghx-md-readme > :last-child { margin-bottom: 0 !important; }
        .ghx-md-readme h1,
        .ghx-md-readme h2 {
          padding-bottom: 0.3em;
          border-bottom: 1px solid ${border};
        }
        .ghx-md-readme h1 { font-size: 2em; margin: 0.67em 0; font-weight: 600; line-height: 1.25; }
        .ghx-md-readme h2 { font-size: 1.5em; margin: 1.35em 0 0.55em; font-weight: 600; line-height: 1.25; }
        .ghx-md-readme h3 { font-size: 1.25em; margin: 1.25em 0 0.5em; font-weight: 600; line-height: 1.25; }
        .ghx-md-readme h4 { font-size: 1em; margin: 1.15em 0 0.4em; font-weight: 600; }
        .ghx-md-readme p,
        .ghx-md-readme blockquote,
        .ghx-md-readme ul,
        .ghx-md-readme ol,
        .ghx-md-readme table,
        .ghx-md-readme pre,
        .ghx-md-readme details {
          margin-top: 0;
          margin-bottom: 16px;
        }
        .ghx-md-readme ul,
        .ghx-md-readme ol {
          padding-left: 2em;
        }
        .ghx-md-readme li + li { margin-top: 0.25em; }
        .ghx-md-readme li > p { margin-top: 16px; }
        .ghx-md-readme input[type="checkbox"] { margin: 0 0.45em 0.2em -1.4em; vertical-align: middle; }
        .ghx-md-readme table {
          display: block;
          width: max-content;
          max-width: 100%;
          overflow: auto;
          border-spacing: 0;
          border-collapse: collapse;
        }
        .ghx-md-readme th,
        .ghx-md-readme td {
          padding: 6px 13px;
          border: 1px solid ${border};
        }
        .ghx-md-readme tr {
          background: ${readmeCardBg};
          border-top: 1px solid ${border};
        }
        .ghx-md-readme tr:nth-child(2n) { background: ${subtleBg}; }
        .ghx-md-readme code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          white-space: break-spaces;
          background: ${isDark ? 'rgba(110,118,129,0.4)' : 'rgba(175,184,193,0.2)'};
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, SFMono, Consolas, "Liberation Mono", Menlo, monospace;
        }
        .ghx-md-readme pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background: ${isDark ? '#161b22' : '#f6f8fa'};
          border-radius: 6px;
        }
        .ghx-md-readme pre code {
          padding: 0;
          background: transparent;
          white-space: pre;
        }
        .ghx-md-readme blockquote {
          padding: 0 1em;
          color: ${mutedFg};
          border-left: 0.25em solid ${border};
        }
        .ghx-md-readme img {
          max-width: 100%;
          box-sizing: content-box;
          background: ${readmeCardBg};
        }
        .ghx-md-readme hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background: ${border};
          border: 0;
        }
        .ghx-md-readme details {
          padding: 12px 16px;
          border: 1px solid ${border};
          border-radius: 6px;
          background: ${subtleBg};
        }
        .ghx-md-readme summary { cursor: pointer; font-weight: 600; }
        .ghx-mermaid-block {
          margin: 16px 0;
          padding: 16px;
          overflow-x: auto;
          border: 1px solid ${border};
          border-radius: 6px;
          background: ${isDark ? '#0d1117' : '#ffffff'};
        }
        .ghx-mermaid-diagram {
          margin: 0 auto 12px !important;
          padding: 0 !important;
          background: transparent !important;
          text-align: center;
        }
        .ghx-mermaid-diagram svg {
          max-width: 100%;
          height: auto;
        }
        .ghx-mermaid-source {
          margin: 0 !important;
          font-size: 12px;
        }
        .ghx-mermaid-source code {
          display: block;
          margin-top: 8px;
          white-space: pre;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes >= 10 * 1024 ? 0 : 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}
