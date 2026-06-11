'use client';

import { useState, type ReactNode } from 'react';
import { FaGithub, FaFire, FaArrowUpRightFromSquare } from 'react-icons/fa6';
import type { GitHubActivity } from '@/lib/github-activity';
import { openExternalUrl } from '@/lib/open-external';

interface GitHubStatsProps {
  isDark: boolean;
  activity: GitHubActivity | null;
  isLoading: boolean;
  hasError: boolean;
}

export function GitHubStats({ isDark, activity, isLoading, hasError }: GitHubStatsProps) {
  const [hover, setHover] = useState(false);
  const open = () => openExternalUrl('https://github.com/LakshmanTurlapati');
  const stats = formatStats(activity);
  const statusLabel = getStatusLabel(activity, isLoading, hasError);
  const degraded = hasError || activity?.source === 'fallback';

  return (
    <div
      className="absolute bottom-5 left-1/2 z-30 cursor-pointer select-none transition-all duration-250 max-w-[520px] hidden sm:block"
      onClick={open}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(); }}
      aria-label="GitHub activity — opens profile"
      style={{
        transform: hover ? 'translateX(-50%) translateY(-2px)' : 'translateX(-50%)',
        padding: '10px 16px',
        borderRadius: 22,
        background: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
        color: isDark ? '#1a1a1a' : '#e8e4d8',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* Main stats row */}
      <div className="flex items-center gap-3.5">
        <FaGithub className="text-lg opacity-85 mr-0.5" />

        <StatCell num={stats.totalContrib} label="contributions" muted={isLoading || degraded} />
        <Divider />
        <StatCell
          num={
            <>
              {stats.currentStreak}
              {!isLoading && !hasError && (
                <>
                  <span className="text-[10px] font-medium opacity-60 ml-px">d</span>
                  <FaFire className="text-[10px] ml-1 opacity-70 -translate-y-px" />
                </>
              )}
            </>
          }
          label="streak"
          muted={isLoading || degraded}
        />
        <Divider />
        <StatCell num={stats.stars} label="stars" muted={isLoading || degraded} />
        <Divider />
        <StatCell num={stats.repos} label="repos" muted={isLoading || degraded} />
      </div>

      {/* Expandable detail */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: hover ? 120 : 0,
          opacity: hover ? 1 : 0,
          marginTop: hover ? 10 : 0,
          paddingTop: hover ? 8 : 0,
          borderTop: hover ? `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` : 'none',
        }}
      >
        <div className="flex justify-between gap-4 py-0.5 text-[11.5px]">
          <span className="opacity-55 tracking-wide">Longest streak</span>
          <strong className="font-semibold tracking-tight">{stats.longestStreak} days</strong>
        </div>
        <div className="flex justify-between gap-4 py-0.5 text-[11.5px]">
          <span className="opacity-55 tracking-wide">Contributions (12 mo)</span>
          <strong className="font-semibold tracking-tight">{stats.yearlyCommits}</strong>
        </div>
        <div className="flex justify-between gap-4 py-0.5 text-[11.5px]">
          <span className="opacity-55 tracking-wide">Data source</span>
          <strong className="font-semibold tracking-tight">{statusLabel}</strong>
        </div>
        <div
          className="mt-1.5 pt-1.5 text-[10px] uppercase tracking-[0.1em] opacity-65 flex items-center gap-1.5"
          style={{ borderTop: `1px dashed ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}
        >
          View profile <FaArrowUpRightFromSquare className="text-[9px]" />
        </div>
      </div>
    </div>
  );
}

function StatCell({ num, label, muted = false }: { num: ReactNode; label: string; muted?: boolean }) {
  return (
    <div className={`flex flex-col leading-none ${muted ? 'opacity-65' : ''}`}>
      <div className="text-[15px] font-bold tracking-tight inline-flex items-baseline gap-0.5">
        {num}
      </div>
      <div className="text-[9.5px] uppercase tracking-[0.08em] opacity-55 mt-[5px] font-medium">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-[22px] bg-current opacity-15" />;
}

function formatStats(activity: GitHubActivity | null) {
  if (!activity) {
    return {
      totalContrib: '--',
      currentStreak: '--',
      longestStreak: '--',
      repos: '--',
      stars: '--',
      yearlyCommits: '--',
    };
  }

  return {
    totalContrib: activity.totalContributions.toLocaleString(),
    currentStreak: String(activity.currentStreak),
    longestStreak: String(activity.longestStreak),
    repos: String(activity.repos),
    stars: formatCompactNumber(activity.stars),
    yearlyCommits: formatCompactNumber(activity.yearlyCommits),
  };
}

function formatCompactNumber(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

function getStatusLabel(activity: GitHubActivity | null, isLoading: boolean, hasError: boolean): string {
  if (isLoading) {
    return 'Loading';
  }

  if (hasError) {
    return 'Unavailable';
  }

  return activity?.source === 'github' ? 'GitHub live' : 'Fallback';
}
