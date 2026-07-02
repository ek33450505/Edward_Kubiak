/**
 * FeaturedWork.test.jsx — behavioral render tests.
 *
 * Verifies the FeaturedWork component's rendered structure, navigation links,
 * and external-link safety. Tests assert on roles, headings, link hrefs, and
 * ARIA attributes — never on specific project names, stat numbers, or copy
 * that may change between deploys.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeaturedWork from './FeaturedWork';

function renderFeaturedWork() {
  return render(
    <MemoryRouter>
      <FeaturedWork />
    </MemoryRouter>
  );
}

describe('FeaturedWork — section structure', () => {
  it('renders a "Featured Work" section heading', () => {
    renderFeaturedWork();
    // SectionHeader renders <h2>Featured Work</h2> inside the section
    expect(screen.getByText(/featured work/i)).toBeInTheDocument();
  });

  it('section element has aria-labelledby attribute (a11y: landmark is labeled)', () => {
    const { container } = renderFeaturedWork();
    const section = container.querySelector('section[aria-labelledby]');
    expect(section).toBeInTheDocument();
  });
});

describe('FeaturedWork — flagship card', () => {
  it('renders a "View project →" link pointing to the CAST flagship slug', () => {
    renderFeaturedWork();
    const allLinks = screen.getAllByRole('link');
    const flagshipLink = allLinks.find((l) =>
      (l.getAttribute('href') ?? '').includes('cast-claude-agent-team')
    );
    expect(flagshipLink).toBeInTheDocument();
  });
});

describe('FeaturedWork — trio cards', () => {
  it('renders ≥3 /projects/:slug links (one per trio card at minimum)', () => {
    renderFeaturedWork();
    const allLinks = screen.getAllByRole('link');
    const projectLinks = allLinks.filter(
      (l) => /^\/projects\/.+/.test(l.getAttribute('href') ?? '')
    );
    // flagship (1) + trio (3) = ≥4 total; require at least 3 so the test
    // does not break if the flagship is temporarily absent from the data
    expect(projectLinks.length).toBeGreaterThanOrEqual(3);
  });
});

describe('FeaturedWork — navigation footer', () => {
  it('"See all projects" link points to /projects (not dead /portfolio)', () => {
    renderFeaturedWork();
    // The link text is "See all projects →" — name match is case-insensitive
    const seeAll = screen.getByRole('link', { name: /see all projects/i });
    expect(seeAll).toHaveAttribute('href', '/projects');
  });
});

describe('FeaturedWork — external link safety', () => {
  it('all target="_blank" links carry rel="noopener noreferrer"', () => {
    const { container } = renderFeaturedWork();
    const externalLinks = Array.from(container.querySelectorAll('a[target="_blank"]'));
    // Trio cards may or may not have live-demo links; validate only those present
    externalLinks.forEach((link) => {
      expect(link.rel).toContain('noopener');
      expect(link.rel).toContain('noreferrer');
    });
  });
});
