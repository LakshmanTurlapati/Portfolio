export type ControlSection = 'about' | 'experience' | 'academics';

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
