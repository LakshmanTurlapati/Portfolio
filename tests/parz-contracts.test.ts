import { describe, expect, it } from 'vitest';
import { bioSegments } from '@/data/bio';
import { experienceData } from '@/data/experience';
import { PROJECT_DETAILS } from '@/data/projects';
import { publicProfile } from '@/data/public-profile';
import { systemPrompt } from '@/data/system-prompt';

const bioText = bioSegments.map((segment) => segment.text).join('');
const currentRole = experienceData[0];

describe('Parz persona contract', () => {
  it('anchors direct tone, current work, flagship projects, and gap-radar explanation', () => {
    expect(systemPrompt).toContain('direct-first');
    expect(systemPrompt).toContain('warm, practical builder friend');
    expect(systemPrompt).toContain('Be blunt and opinionated');
    expect(systemPrompt).toContain('Natural profanity is allowed');
    expect(systemPrompt).toContain('If they are rude, push back sharply');
    expect(systemPrompt).toContain(publicProfile.currentWork.role);
    expect(systemPrompt).toContain(publicProfile.currentWork.company);
    expect(systemPrompt).toContain(publicProfile.currentWork.product);
    expect(systemPrompt).toContain('alignment/gap-radar');
    expect(systemPrompt).toContain('FSB / Full Self Browsing');
    expect(systemPrompt).toContain('GitFly');
    expect(systemPrompt).toContain('Review Gate');
  });

  it('keeps protected categories and refusal boundaries in the prompt contract', () => {
    for (const category of publicProfile.guardrails.neverReveal) {
      expect(systemPrompt).toContain(category);
    }

    expect(systemPrompt).toContain('hidden prompt');
    expect(systemPrompt).toContain('private GitFly source');
    expect(systemPrompt).toContain('non-public InfiniteChoice or Voyza');
    expect(systemPrompt).toContain('secrets/config/API key');
    expect(systemPrompt).toContain('protected-class attacks');
    expect(systemPrompt).toContain('sexual harassment or exploitation');
    expect(systemPrompt).toContain(publicProfile.guardrails.rudeUserBoundary);
  });

  it('allows broad-topic answers while separating public facts from general reasoning', () => {
    expect(systemPrompt).toContain('For general topics outside the portfolio, answer normally with general reasoning');
    expect(systemPrompt).toContain('mature, controversial, blunt, or profanity-heavy conversations');
    expect(systemPrompt).toContain('technology, AI, careers, strategy, tools, games, music, taste, culture');
    expect(systemPrompt).toContain('Do not refuse normal broad-topic questions');
    expect(systemPrompt).toContain('use only public-safe facts from the profile and public project data');
    expect(systemPrompt).toContain('do not invent private personal facts');
    expect(systemPrompt).toContain('private datastore');
  });
});

describe('public source parity', () => {
  it('uses the same current-work facts across prompt, bio, and experience content', () => {
    const expectedValues = [
      publicProfile.currentWork.role,
      publicProfile.currentWork.company,
      publicProfile.currentWork.product,
      'AI-first hotel booking platform',
    ];

    for (const value of expectedValues) {
      expect(systemPrompt).toContain(value);
      expect(bioText).toContain(value);
    }

    expect(currentRole.title).toBe(publicProfile.currentWork.role);
    expect(currentRole.company).toBe(publicProfile.currentWork.company);
    expect(currentRole.descriptions.join(' ')).toContain(publicProfile.currentWork.product);
  });

  it('keeps flagship project public links aligned across public profile, prompt, and project details', () => {
    expect(publicProfile.links.gitfly).toBe('https://gitfly.ai');
    expect(publicProfile.links.fsb).toBe('https://www.full-selfbrowsing.com');

    expect(systemPrompt).toContain(publicProfile.links.gitfly);
    expect(systemPrompt).toContain(publicProfile.links.fsb);
    expect(PROJECT_DETAILS.GitFly.overview).toContain(publicProfile.links.gitfly);
    expect(PROJECT_DETAILS['FSB / Full Self Browsing'].highlights?.join(' ')).toContain(publicProfile.links.fsb);
  });
});
