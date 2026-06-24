/**
 * FeaturedWork.test.jsx — structure regression tests.
 *
 * Verifies that the FeaturedWork component explicitly selects looptrip, misfire,
 * and attest as the trio (not via a generic `featured` filter), and that the
 * dead link to `/portfolio` has been corrected to `/projects`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, 'FeaturedWork.jsx'), 'utf8');

describe('FeaturedWork — trio slug selection', () => {
  it('includes "looptrip" in the trio slug list', () => {
    expect(src).toContain('"looptrip"');
  });

  it('includes "misfire" in the trio slug list', () => {
    expect(src).toContain('"misfire"');
  });

  it('includes "attest" in the trio slug list', () => {
    expect(src).toContain('"attest"');
  });

  it('selects flagship by slug, not by featured filter', () => {
    expect(src).toContain('"cast-claude-agent-team"');
    // The old `filter(featured).slice(0,3)` pattern should be gone
    expect(src).not.toContain('.filter((p) => p.featured === true)');
  });
});

describe('FeaturedWork — navigation links', () => {
  it('links "See all projects" to /projects (not dead /portfolio)', () => {
    expect(src).toContain('to="/projects"');
    expect(src).not.toContain('to="/portfolio"');
  });
});

describe('FeaturedWork — trio card layout', () => {
  it('uses line-clamp-3 for description truncation instead of slice(0,80)', () => {
    expect(src).toContain('line-clamp-3');
    expect(src).not.toContain('slice(0, 80)');
  });

  it('pins trio card footer with mt-auto', () => {
    expect(src).toContain('mt-auto');
  });
});
