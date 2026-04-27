import { describe, expect, it } from 'vitest';
import {
  buildContributionMatrix,
  buildGitHubActivity,
  calculateContributionStreaks,
  parseGitHubContributionsHtml,
} from '@/lib/github-activity';

const SAMPLE_CONTRIBUTIONS_HTML = `
  <h2 class="f4 text-normal mb-2">12 contributions in the last year</h2>
  <table>
    <tbody>
      <tr>
        <td data-date="2026-04-19" id="contribution-day-component-0-0" data-level="0" class="ContributionCalendar-day"></td>
        <tool-tip for="contribution-day-component-0-0">No contributions on April 19th.</tool-tip>
        <td data-date="2026-04-20" id="contribution-day-component-0-1" data-level="1" class="ContributionCalendar-day"></td>
        <tool-tip for="contribution-day-component-0-1">1 contribution on April 20th.</tool-tip>
        <td data-date="2026-04-21" id="contribution-day-component-0-2" data-level="2" class="ContributionCalendar-day"></td>
        <tool-tip for="contribution-day-component-0-2">2 contributions on April 21st.</tool-tip>
        <td data-date="2026-04-22" id="contribution-day-component-0-3" data-level="0" class="ContributionCalendar-day"></td>
        <tool-tip for="contribution-day-component-0-3">No contributions on April 22nd.</tool-tip>
        <td data-date="2026-04-23" id="contribution-day-component-0-4" data-level="4" class="ContributionCalendar-day"></td>
        <tool-tip for="contribution-day-component-0-4">5 contributions on April 23rd.</tool-tip>
        <td data-date="2026-04-24" id="contribution-day-component-0-5" data-level="3" class="ContributionCalendar-day"></td>
        <tool-tip for="contribution-day-component-0-5">3 contributions on April 24th.</tool-tip>
        <td data-date="2026-04-25" id="contribution-day-component-0-6" data-level="1" class="ContributionCalendar-day"></td>
        <tool-tip for="contribution-day-component-0-6">1 contribution on April 25th.</tool-tip>
      </tr>
    </tbody>
  </table>
`;

describe('GitHub activity parsing', () => {
  it('extracts contribution totals, daily counts, and GitHub intensity levels', () => {
    const parsed = parseGitHubContributionsHtml(SAMPLE_CONTRIBUTIONS_HTML);

    expect(parsed.totalContributions).toBe(12);
    expect(parsed.contributionDays).toHaveLength(7);
    expect(parsed.contributionDays[0]).toEqual({ date: '2026-04-19', count: 0, level: 0 });
    expect(parsed.contributionDays[4]).toEqual({ date: '2026-04-23', count: 5, level: 4 });
  });

  it('calculates current and longest streaks from GitHub days', () => {
    const streaks = calculateContributionStreaks([
      { date: '2026-04-20', count: 1, level: 1 },
      { date: '2026-04-21', count: 2, level: 2 },
      { date: '2026-04-22', count: 0, level: 0 },
      { date: '2026-04-23', count: 5, level: 4 },
      { date: '2026-04-24', count: 3, level: 3 },
      { date: '2026-04-25', count: 1, level: 1 },
      { date: '2026-04-26', count: 0, level: 0 },
    ]);

    expect(streaks).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('normalizes contribution days into a Sunday-first matrix', () => {
    const { contributionDays } = parseGitHubContributionsHtml(SAMPLE_CONTRIBUTIONS_HTML);
    const matrix = buildContributionMatrix(contributionDays, 2);

    expect(matrix).toHaveLength(7);
    expect(matrix[0]).toHaveLength(2);
    expect(matrix[0][0]).toMatchObject({ date: '2026-04-12', isPlaceholder: true });
    expect(matrix[0][1]).toMatchObject({ date: '2026-04-19', count: 0, level: 0, isPlaceholder: false });
    expect(matrix[6][1]).toMatchObject({ date: '2026-04-25', count: 1, level: 1, isPlaceholder: false });
  });

  it('builds the public activity payload from parsed contributions and repo metadata', () => {
    const parsed = parseGitHubContributionsHtml(SAMPLE_CONTRIBUTIONS_HTML);
    const activity = buildGitHubActivity({
      ...parsed,
      publicRepos: 2,
      repos: [{ stargazers_count: 10 }, { stargazers_count: 7 }],
      fetchedAt: '2026-04-27T00:00:00.000Z',
    });

    expect(activity).toMatchObject({
      totalContributions: 12,
      yearlyCommits: 12,
      currentStreak: 3,
      longestStreak: 3,
      repos: 2,
      stars: 17,
      source: 'github',
      fetchedAt: '2026-04-27T00:00:00.000Z',
    });
    expect(activity.contributionDays).toHaveLength(7);
  });
});
