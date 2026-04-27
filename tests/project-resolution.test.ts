import { describe, expect, it } from 'vitest';
import {
  getProjectBrowserTarget,
  isApprovedProjectUrl,
  normalizePreviewScrollDirection,
  normalizeSection,
  resolveProject,
} from './test-imports';

describe('project resolution safety', () => {
  it.each([
    ['FSB', 'FSB / Full Self Browsing', 'https://www.full-selfbrowsing.com'],
    ['Full Self Browsing', 'FSB / Full Self Browsing', 'https://www.full-selfbrowsing.com'],
    ['GitFly', 'GitFly', 'https://gitfly.ai'],
    ['Review Gate', 'Review Gate', 'https://github.com/LakshmanTurlapati/Review-Gate'],
    ['T2S', 'T2S CLI', 'https://github.com/LakshmanTurlapati/t2s-cli'],
    ['Parz-AI', 'Parz-AI', 'https://github.com/LakshmanTurlapati/Parz-AI'],
  ])('resolves %s to canonical project target', (alias, expectedName, expectedUrl) => {
    const project = resolveProject(alias);
    expect(project?.name).toBe(expectedName);
    expect(project && getProjectBrowserTarget(project)?.url).toBe(expectedUrl);
    expect(isApprovedProjectUrl(expectedUrl)).toBe(true);
  });

  it('rejects unknown projects and arbitrary model-invented URLs', () => {
    expect(resolveProject('made up secret gitfly repo')).toBeNull();
    expect(isApprovedProjectUrl('https://github.com/LakshmanTurlapati/private-gitfly')).toBe(false);
    expect(isApprovedProjectUrl('https://evil.example/phish')).toBe(false);
  });

  it('normalizes supported about-page section aliases only', () => {
    expect(normalizeSection('#experience')).toBe('experience');
    expect(normalizeSection('education')).toBe('academics');
    expect(normalizeSection('bio')).toBe('about');
    expect(normalizeSection('secrets')).toBeNull();
  });

  it('normalizes supported project-preview scroll directions only', () => {
    expect(normalizePreviewScrollDirection(undefined)).toBe('down');
    expect(normalizePreviewScrollDirection('up')).toBe('up');
    expect(normalizePreviewScrollDirection('bottom')).toBe('bottom');
    expect(normalizePreviewScrollDirection('sideways')).toBeNull();
  });
});
