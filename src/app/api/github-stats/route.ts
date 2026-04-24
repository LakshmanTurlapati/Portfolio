import { NextResponse } from 'next/server';

export const revalidate = 3600;

const FALLBACK = {
  totalContributions: 4755,
  currentStreak: 49,
  longestStreak: 49,
  repos: 74,
  stars: 1624,
  yearlyCommits: 4755,
};

export async function GET() {
  try {
    const [htmlRes, userRes, reposRes] = await Promise.all([
      fetch('https://github.com/users/LakshmanTurlapati/contributions', {
        headers: { 'User-Agent': 'portfolio-app/1.0' },
        next: { revalidate: 3600 },
      }).then((r) => r.text()),
      fetch('https://api.github.com/users/LakshmanTurlapati', {
        headers: {
          'User-Agent': 'portfolio-app/1.0',
          'Accept': 'application/vnd.github+json',
        },
        next: { revalidate: 3600 },
      }).then((r) => r.json()),
      fetch('https://api.github.com/users/LakshmanTurlapati/repos?per_page=100&type=owner', {
        headers: {
          'User-Agent': 'portfolio-app/1.0',
          'Accept': 'application/vnd.github+json',
        },
        next: { revalidate: 3600 },
      }).then((r) => r.json()),
    ]);

    const html = htmlRes as string;
    const userJson = userRes as { public_repos?: number };
    const reposJson = reposRes as Array<{ stargazers_count: number }>;

    // Extract tooltip counts — use tooltip text (not data-level which is 0-4 intensity only)
    const tooltipMatches = html.matchAll(
      /for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]+)<\/tool-tip>/g
    );

    // Build a map from component ID to count
    const countById = new Map<string, number>();
    for (const m of tooltipMatches) {
      const id = m[1];
      const text = m[2];
      const countMatch = text.match(/^(\d+)\s+contribution/);
      if (countMatch) {
        countById.set(id, parseInt(countMatch[1], 10));
      }
    }

    // Extract <td> elements with data-date and their component IDs
    const tdMatches = html.matchAll(/<td[^>]+class="ContributionCalendar-day"[^>]*>/g);
    const days: { date: string; count: number }[] = [];

    for (const m of tdMatches) {
      const tdTag = m[0];
      const dateMatch = tdTag.match(/data-date="([^"]+)"/);
      const idMatch = tdTag.match(/id="(contribution-day-component-[^"]+)"/);
      if (dateMatch) {
        const date = dateMatch[1];
        // Look up count from tooltip map; default to 0 if not found
        const count = idMatch ? (countById.get(idMatch[1]) ?? 0) : 0;
        days.push({ date, count });
      }
    }

    // Sort ascending by date
    days.sort((a, b) => a.date.localeCompare(b.date));

    // Extract total contributions from h2 text
    const totalMatch = html.match(/(\d[\d,]+)\s*\n\s*contributions/);
    const totalContributions = totalMatch
      ? parseInt(totalMatch[1].replace(/,/g, ''), 10)
      : FALLBACK.totalContributions;

    // Calculate current streak: walk backward from today
    // If today has 0 contributions, start from yesterday (per Pitfall 2)
    let currentStreak = 0;
    if (days.length > 0) {
      let startIdx = days.length - 1;
      if (days[startIdx].count === 0 && startIdx > 0) {
        startIdx--;
      }
      for (let i = startIdx; i >= 0; i--) {
        if (days[i].count > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak: single pass over sorted days
    let longestStreak = 0;
    let runLength = 0;
    for (const day of days) {
      if (day.count > 0) {
        runLength++;
        if (runLength > longestStreak) {
          longestStreak = runLength;
        }
      } else {
        runLength = 0;
      }
    }

    // Calculate total stars across all owned repos
    const totalStars = Array.isArray(reposJson)
      ? reposJson.reduce((s, r) => s + (r.stargazers_count ?? 0), 0)
      : FALLBACK.stars;

    return NextResponse.json({
      totalContributions,
      currentStreak,
      longestStreak,
      repos: userJson.public_repos ?? FALLBACK.repos,
      stars: totalStars,
      yearlyCommits: totalContributions,
    });
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
