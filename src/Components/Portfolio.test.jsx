/**
 * Portfolio.test.jsx — structure regression tests.
 *
 * Verifies that the Portfolio component renders the four labeled sections
 * and that filter-tab machinery has been fully removed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, 'Portfolio.jsx'), 'utf8');

describe('Portfolio — four section headings', () => {
  it('renders a "Flagship" section heading', () => {
    expect(src).toContain('"Flagship"');
  });

  it('renders an "AI & Claude Code Tools" section heading', () => {
    expect(src).toContain('"AI & Claude Code Tools"');
  });

  it('renders a "CAST Ecosystem" section heading', () => {
    expect(src).toContain('"CAST Ecosystem"');
  });

  it('renders a "Professional" section heading', () => {
    expect(src).toContain('"Professional"');
  });
});

describe('Portfolio — sections use group-based filtering', () => {
  it('filters projects by group key', () => {
    expect(src).toContain('p.group === key');
  });

  it('uses aria-labelledby on section elements', () => {
    expect(src).toContain('aria-labelledby');
  });
});

describe('Portfolio — filter machinery removed', () => {
  it('no longer has a filter state variable', () => {
    expect(src).not.toContain("const [filter, setFilter]");
  });

  it('no longer has the filters array with "all" and "featured" keys', () => {
    expect(src).not.toContain('{ key: "all"');
    expect(src).not.toContain('{ key: "featured"');
  });

  it('no longer has VALID_FILTERS', () => {
    expect(src).not.toContain('VALID_FILTERS');
  });

  it('no longer has handleTabKeyDown', () => {
    expect(src).not.toContain('handleTabKeyDown');
  });

  it('no longer has a role=tablist element', () => {
    expect(src).not.toContain('role="tablist"');
  });

  it('no longer reads filter from useSearchParams', () => {
    expect(src).not.toContain('useSearchParams');
  });
});
