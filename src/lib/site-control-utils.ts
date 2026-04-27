export type ControlSection = 'about' | 'experience' | 'academics';
export type PreviewScrollDirection = 'down' | 'up' | 'top' | 'bottom';
export type PreviewScroller = (direction: PreviewScrollDirection) => boolean;

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

export function normalizeSection(section: ControlSection | string): ControlSection | null {
  return SECTION_ALIASES[section.replace(/^#/, '').toLowerCase()] || null;
}

export function normalizePreviewScrollDirection(
  direction: PreviewScrollDirection | string | undefined,
): PreviewScrollDirection | null {
  if (!direction) return 'down';
  const normalized = direction.toLowerCase();
  if (
    normalized === 'down' ||
    normalized === 'up' ||
    normalized === 'top' ||
    normalized === 'bottom'
  ) {
    return normalized;
  }
  return null;
}
