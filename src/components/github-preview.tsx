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
} from 'react-icons/fa6';

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

function rewriteRelativeUrls(html: string, rawBase: string, blobBase: string): string {
  if (!html) return html;
  // <img src="relative/path"> → raw.githubusercontent.com
  html = html.replace(/<img([^>]*?)src="(?!https?:|data:|\/\/|#)([^"]+)"/g, (_m, attrs, src) => {
    const clean = src.replace(/^\.\//, '').replace(/^\//, '');
    return `<img${attrs}src="${rawBase}${clean}"`;
  });
  // <a href="relative/path"> → github.com/.../blob/...
  html = html.replace(/<a([^>]*?)href="(?!https?:|mailto:|#|\/\/)([^"]+)"/g, (_m, attrs, href) => {
    const clean = href.replace(/^\.\//, '').replace(/^\//, '');
    return `<a${attrs}href="${blobBase}${clean}" target="_blank" rel="noopener"`;
  });
  // Absolute links: open in new tab
  html = html.replace(/<a([^>]*?)href="(https?:\/\/[^"]+)"/g, (_m, attrs, href) => {
    if (/target="/.test(attrs)) return _m;
    return `<a${attrs}href="${href}" target="_blank" rel="noopener"`;
  });
  return html;
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

// ===== Component =====

export interface GithubPreviewProps {
  url: string;
  isDark: boolean;
}

export function GithubPreview({ url, isDark }: GithubPreviewProps) {
  const parsed = useMemo(() => parseGithubUrl(url), [url]);
  const [repo, setRepo] = useState<RepoData | null>(null);
  const [readmeHtml, setReadmeHtml] = useState('');
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [langs, setLangs] = useState<LangMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mdRef = useRef<HTMLDivElement>(null);

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

        const [readmeRaw, contribData, langsData] = await Promise.all([
          fetch(`${base}/readme`, { headers: { Accept: 'application/vnd.github.raw' } }).then(r => r.ok ? r.text() : ''),
          fetch(`${base}/contributors?per_page=8`).then(r => r.ok ? r.json() : []),
          fetch(`${base}/languages`).then(r => r.ok ? r.json() : {}),
        ]);
        if (cancel) return;
        setContributors(Array.isArray(contribData) ? contribData : []);
        setLangs(langsData || {});

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
        setReadmeHtml(html);
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

  // T-05-02 mitigated: content originates from GitHub's markdown API (server-sanitized).
  // Relative URLs rewritten to absolute before injection; external links get target="_blank" rel="noopener".
  // {/* Mermaid rendering intentionally omitted — out of scope */}

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
          onClick={() => window.open(url, '_blank')}
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
            <button style={btnStyle} onClick={() => window.open(repo.html_url + '/watchers', '_blank')}>
              <FaEye style={{ fontSize: 12 }} /> Watch
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', marginLeft: 2, background: countBg, borderRadius: 10 }}>
                {formatNum(repo.subscribers_count || repo.watchers_count)}
              </span>
            </button>
            <button style={btnStyle} onClick={() => window.open(repo.html_url + '/forks', '_blank')}>
              <FaCodeFork style={{ fontSize: 12 }} /> Fork
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', marginLeft: 2, background: countBg, borderRadius: 10 }}>
                {formatNum(repo.forks_count)}
              </span>
            </button>
            <button style={btnStyle} onClick={() => window.open(repo.html_url + '/stargazers', '_blank')}>
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
      `}</style>
    </div>
  );
}
