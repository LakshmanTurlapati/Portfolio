import { allProjects } from '@/data/projects';
import { publicProfile } from '@/data/public-profile';

const DIRECT_ALLOWED_HOSTS = new Set([
  'parzival.live',
  'full-selfbrowsing.com',
  'www.full-selfbrowsing.com',
  'gitfly.ai',
  'www.gitfly.ai',
]);

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    url.hash = '';
    const normalized = url.toString();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return null;
  }
}

const EXACT_ALLOWED_URLS = new Set(
  [
    ...allProjects.flatMap((project) => Object.values(project.links)),
    ...Object.values(publicProfile.links),
  ]
    .map(normalizeUrl)
    .filter((url): url is string => Boolean(url)),
);

export function isApprovedExternalLink(value: string): boolean {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;

  const url = new URL(normalized);
  if (DIRECT_ALLOWED_HOSTS.has(url.hostname)) return true;

  return EXACT_ALLOWED_URLS.has(normalized);
}
