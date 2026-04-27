export type GitHubActivitySource = 'github' | 'fallback';

export interface GitHubContributionDay {
  date: string;
  count: number;
  level: number;
}

export interface GitHubContributionCell extends GitHubContributionDay {
  isPlaceholder: boolean;
}

export interface GitHubActivity {
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  repos: number;
  stars: number;
  yearlyCommits: number;
  contributionDays: GitHubContributionDay[];
  source: GitHubActivitySource;
  fetchedAt: string;
}

interface BuildGitHubActivityInput {
  totalContributions: number;
  contributionDays: GitHubContributionDay[];
  publicRepos?: number;
  repos?: Array<{ stargazers_count?: number | null }>;
  fetchedAt?: string;
}

const ROWS_PER_WEEK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const FALLBACK_GITHUB_STATS = {
  totalContributions: 4899,
  currentStreak: 3,
  longestStreak: 49,
  repos: 74,
  stars: 1624,
  yearlyCommits: 4899,
};

export function parseGitHubContributionsHtml(html: string): {
  totalContributions: number;
  contributionDays: GitHubContributionDay[];
} {
  const countById = new Map<string, number>();
  const tooltipMatches = html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g);

  for (const match of tooltipMatches) {
    const count = parseContributionCount(match[2]);

    if (typeof count === 'number') {
      countById.set(match[1], count);
    }
  }

  const dayMatches = html.matchAll(
    /<td\b(?=[^>]*\bclass="[^"]*\bContributionCalendar-day\b[^"]*")[^>]*>/g
  );
  const contributionDays: GitHubContributionDay[] = [];

  for (const match of dayMatches) {
    const tag = match[0];
    const date = getAttribute(tag, 'data-date');

    if (!date) {
      continue;
    }

    const id = getAttribute(tag, 'id');
    const parsedLevel = Number.parseInt(getAttribute(tag, 'data-level') ?? '0', 10);
    const count = id ? (countById.get(id) ?? 0) : 0;
    const level = clampNumber(Number.isFinite(parsedLevel) ? parsedLevel : 0, 0, 4);

    contributionDays.push({ date, count, level });
  }

  if (contributionDays.length === 0) {
    throw new Error('No GitHub contribution days found');
  }

  contributionDays.sort((a, b) => a.date.localeCompare(b.date));

  const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i)
    ?? html.match(/([\d,]+)\s*\n\s*contributions?/i);
  const totalContributions = totalMatch
    ? Number.parseInt(totalMatch[1].replace(/,/g, ''), 10)
    : contributionDays.reduce((sum, day) => sum + day.count, 0);

  return {
    totalContributions,
    contributionDays,
  };
}

export function buildGitHubActivity(input: BuildGitHubActivityInput): GitHubActivity {
  const streaks = calculateContributionStreaks(input.contributionDays);
  const stars = Array.isArray(input.repos)
    ? input.repos.reduce((sum, repo) => sum + safeNumber(repo.stargazers_count), 0)
    : FALLBACK_GITHUB_STATS.stars;

  return {
    totalContributions: input.totalContributions,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    repos: safeNumber(input.publicRepos, FALLBACK_GITHUB_STATS.repos),
    stars,
    yearlyCommits: input.totalContributions,
    contributionDays: input.contributionDays,
    source: 'github',
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
  };
}

export function createFallbackGitHubActivity(fetchedAt = new Date().toISOString()): GitHubActivity {
  return {
    ...FALLBACK_GITHUB_STATS,
    contributionDays: [],
    source: 'fallback',
    fetchedAt,
  };
}

export function calculateContributionStreaks(contributionDays: GitHubContributionDay[]): {
  currentStreak: number;
  longestStreak: number;
} {
  const days = [...contributionDays].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let runLength = 0;

  for (const day of days) {
    if (day.count > 0) {
      runLength += 1;
      longestStreak = Math.max(longestStreak, runLength);
    } else {
      runLength = 0;
    }
  }

  if (days.length > 0) {
    let startIndex = days.length - 1;

    if (days[startIndex].count === 0 && startIndex > 0) {
      startIndex -= 1;
    }

    for (let index = startIndex; index >= 0; index -= 1) {
      if (days[index].count > 0) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

export function buildContributionMatrix(
  contributionDays: GitHubContributionDay[],
  columns: number
): GitHubContributionCell[][] {
  const safeColumns = Math.max(1, Math.floor(columns));
  const byDate = new Map(
    contributionDays.map((day) => [
      day.date,
      {
        date: day.date,
        count: Math.max(0, Math.floor(day.count)),
        level: clampNumber(Math.floor(day.level), 0, 4),
      },
    ])
  );
  const latestDateValue = [...byDate.keys()].sort().at(-1);
  const latestDate = latestDateValue ? parseIsoDate(latestDateValue) : null;

  if (!latestDate) {
    return createPlaceholderMatrix(safeColumns);
  }

  const latestWeekStart = addUtcDays(latestDate, -latestDate.getUTCDay());
  const firstWeekStart = addUtcDays(latestWeekStart, -(safeColumns - 1) * ROWS_PER_WEEK);

  return Array.from({ length: ROWS_PER_WEEK }, (_, rowIndex) =>
    Array.from({ length: safeColumns }, (_, columnIndex) => {
      const date = formatIsoDate(addUtcDays(firstWeekStart, columnIndex * ROWS_PER_WEEK + rowIndex));
      const contributionDay = byDate.get(date);

      return {
        date,
        count: contributionDay?.count ?? 0,
        level: contributionDay?.level ?? 0,
        isPlaceholder: !contributionDay,
      };
    })
  );
}

function createPlaceholderMatrix(columns: number): GitHubContributionCell[][] {
  return Array.from({ length: ROWS_PER_WEEK }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => ({
      date: `placeholder-${rowIndex}-${columnIndex}`,
      count: 0,
      level: 0,
      isPlaceholder: true,
    }))
  );
}

function parseContributionCount(rawText: string): number | null {
  const text = rawText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  if (/^No contributions/i.test(text)) {
    return 0;
  }

  const countMatch = text.match(/^([\d,]+)\s+contribution/i);
  return countMatch ? Number.parseInt(countMatch[1].replace(/,/g, ''), 10) : null;
}

function getAttribute(tag: string, attribute: string): string | null {
  const match = tag.match(new RegExp(`\\b${attribute}="([^"]*)"`));
  return match?.[1] ?? null;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseIsoDate(date: string): Date | null {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(Date.UTC(
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10) - 1,
    Number.parseInt(match[3], 10)
  ));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
