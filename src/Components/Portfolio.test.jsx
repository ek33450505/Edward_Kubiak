/**
 * Portfolio.test.jsx — behavioral render tests.
 *
 * Verifies the Portfolio component's DOM structure and navigation behavior.
 * Tests assert on roles, headings, link hrefs, and ARIA attributes —
 * never on specific project names, stat numbers, or copy that may change.
 *
 * Source-level assertions (readFileSync) are retained ONLY for the
 * "no filter machinery" guard: re-expressing the absence of useSearchParams
 * behaviorally would require exercising URL state that the feature no longer
 * has. The comment below explains the design intent for future phases.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Portfolio from './Portfolio';

// useGitHubStars makes live network requests — mock it so tests don't
// depend on network access or GitHub rate limits.
vi.mock('../hooks/useGitHubStars', () => ({
  useGitHubStars: () => ({ stars: null, loading: false }),
}));

function renderPortfolio() {
  return render(
    <MemoryRouter>
      <Portfolio />
    </MemoryRouter>
  );
}

describe('Portfolio — page heading', () => {
  it('renders the "Projects" h1 page title', () => {
    renderPortfolio();
    expect(screen.getByRole('heading', { level: 1, name: /projects/i })).toBeInTheDocument();
  });
});

describe('Portfolio — grouped sections', () => {
  it('renders at least one h2 section heading', () => {
    renderPortfolio();
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders sections with aria-labelledby (a11y: landmark regions are labeled)', () => {
    const { container } = renderPortfolio();
    const sections = container.querySelectorAll('section[aria-labelledby]');
    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  it('renders project cards as links to /projects/:slug', () => {
    renderPortfolio();
    const allLinks = screen.getAllByRole('link');
    const projectLinks = allLinks.filter(
      (l) => /^\/projects\/.+/.test(l.getAttribute('href') ?? '')
    );
    expect(projectLinks.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Portfolio — external link safety', () => {
  it('all target="_blank" links carry rel="noopener noreferrer"', () => {
    const { container } = renderPortfolio();
    const externalLinks = Array.from(container.querySelectorAll('a[target="_blank"]'));
    externalLinks.forEach((link) => {
      expect(link.rel).toContain('noopener');
      expect(link.rel).toContain('noreferrer');
    });
  });
});

describe('Portfolio — section id anchors', () => {
  it('renders section elements with id="section-<key>" for hash deep-links', () => {
    const { container } = renderPortfolio();
    // These must match the SECTIONS keys in Portfolio.jsx
    const expectedIds = ['section-flagship', 'section-tools', 'section-ecosystem', 'section-professional'];
    // At least one anchored section must be present (empty groups are skipped)
    const found = expectedIds.filter((id) => container.querySelector(`#${id}`) !== null);
    expect(found.length).toBeGreaterThanOrEqual(1);
    // Every anchored section must be a <section> element
    found.forEach((id) => {
      const el = container.querySelector(`#${id}`);
      expect(el.tagName.toLowerCase()).toBe('section');
    });
  });
});

describe('Portfolio — no filter machinery (source guard)', () => {
  /**
   * These are intentional source-level assertions — they guard against
   * re-introducing the old URL-search-param / tablist filtering pattern
   * that was removed in favor of the current group-based sections design.
   *
   * A purely behavioral equivalent would require simulating URL changes
   * that only make sense if the feature exists. If a future phase adds
   * search-param filtering back, these guards should be converted to
   * behavioral tab-interaction tests at that time.
   */
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(resolve(__dirname, 'Portfolio.jsx'), 'utf8');

  it('does not use useSearchParams (filter-tab pattern removed)', () => {
    expect(src).not.toContain('useSearchParams');
  });

  it('does not have a filter state variable', () => {
    expect(src).not.toContain('const [filter, setFilter]');
  });

  it('does not have a role="tablist" element (tab UI removed)', () => {
    expect(src).not.toContain('role="tablist"');
  });
});
