import { NextResponse } from 'next/server';
import {
  buildGitHubActivity,
  createFallbackGitHubActivity,
  parseGitHubContributionsHtml,
} from '@/lib/github-activity';

export const revalidate = 900;

type GitHubUserResponse = {
  public_repos?: number;
};

type GitHubRepoResponse = Array<{
  stargazers_count?: number | null;
}>;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

const GITHUB_USERNAME = 'LakshmanTurlapati';
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60',
};

export async function GET() {
  try {
    const [html, userJson, reposJson] = await Promise.all([
      fetchText(`https://github.com/users/${GITHUB_USERNAME}/contributions`, {
        headers: { 'User-Agent': 'portfolio-app/1.0' },
        next: { revalidate },
      }),
      fetchJson<GitHubUserResponse>(`https://api.github.com/users/${GITHUB_USERNAME}`, {
        headers: {
          'User-Agent': 'portfolio-app/1.0',
          'Accept': 'application/vnd.github+json',
          ...authorizationHeader(),
        },
        next: { revalidate },
      }),
      fetchJson<GitHubRepoResponse>(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&type=owner`, {
        headers: {
          'User-Agent': 'portfolio-app/1.0',
          'Accept': 'application/vnd.github+json',
          ...authorizationHeader(),
        },
        next: { revalidate },
      }),
    ]);

    const parsedContributions = parseGitHubContributionsHtml(html);
    const activity = buildGitHubActivity({
      ...parsedContributions,
      publicRepos: userJson.public_repos,
      repos: reposJson,
    });

    return NextResponse.json(activity, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(createFallbackGitHubActivity(), {
      headers: CACHE_HEADERS,
    });
  }
}

async function fetchText(input: string, init: NextFetchInit): Promise<string> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`);
  }

  return response.text();
}

async function fetchJson<T>(input: string, init: NextFetchInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function authorizationHeader(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;

  return token ? { Authorization: `Bearer ${token}` } : {};
}
