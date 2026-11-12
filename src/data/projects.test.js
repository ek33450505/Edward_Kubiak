import { describe, it, expect } from 'vitest';
import projects from './projects';

describe('projects data — eridian', () => {
  it('is in the projects data with its GitHub repo', () => {
    const eridian = projects.find((p) => p.slug === 'eridian');
    expect(eridian?.githubRepo).toEqual({ owner: 'ek33450505', repo: 'eridian' });
  });
});
