/**
 * FeaturedWork.test.jsx — behavioral render tests.
 *
 * Verifies the FeaturedWork component's rendered structure, navigation links,
 * and external-link safety. Tests assert on roles, headings, link hrefs, and
 * ARIA attributes — never on specific project names, stat numbers, or copy
 * that may change between deploys.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
    // SectionHead renders <h2>Featured Work</h2> inside the section
    expect(screen.getByText(/featured work/i)).toBeInTheDocument();
  });

  it('section element has aria-labelledby attribute (a11y: landmark is labeled)', () => {
    const { container } = renderFeaturedWork();
    const section = container.querySelector('section[aria-labelledby]');
    expect(section).toBeInTheDocument();
  });
});

describe('FeaturedWork — card order', () => {
  // Order is a deliberate editorial decision, not incidental: Compute Atlas is the
  // lead card (01) and CAST is second (02). Both the index and the motion delay are
  // per-block literals in the component, so a careless block swap silently produces
  // two cards numbered 01. This is the one place order is pinned on purpose.
  it('renders no cartographic wording', () => {
    const { container } = renderFeaturedWork();
    expect(container.textContent).not.toMatch(/plate/i);
  });

  it('labels the lead card 01 and the CAST card 02, in that order', () => {
    const { container } = renderFeaturedWork();
    const heads = Array.from(container.querySelectorAll('.panel-head')).map((h) => h.textContent);
    expect(heads[0]).toMatch(/^01 · Live product/i);
    expect(heads[1]).toMatch(/^02 · Development architecture/i);
  });

  it('links the Compute Atlas "Cited by" sources as safe external links', () => {
    renderFeaturedWork();
    const cited = screen
      .getAllByRole('link')
      .filter((l) => /opens in new tab/i.test(l.getAttribute('aria-label') ?? ''))
      .filter((l) => /brockovichdatacenter\.com|powertothepeopleproject\.com/.test(l.href));
    expect(cited).toHaveLength(2);
    cited.forEach((l) => {
      expect(l).toHaveAttribute('target', '_blank');
      expect(l.rel).toContain('noopener');
      expect(l.rel).toContain('noreferrer');
    });
  });

  it('serves the Compute Atlas screenshot with webp source, png fallback, and alt text', () => {
    const { container } = renderFeaturedWork();
    const img = screen.getByRole('img', { name: /map of U\.S\. data centers/i });
    expect(img).toHaveAttribute('src', '/media/compute-atlas.png');
    expect(img).toHaveAttribute('width', '1600');
    expect(img).toHaveAttribute('height', '1000');
    expect(container.querySelector('source[srcset="/media/compute-atlas.webp"]')).toBeInTheDocument();
  });

  it('renders Compute Atlas as the lead card, ahead of CAST', () => {
    renderFeaturedWork();
    const slugs = screen
      .getAllByRole('link')
      .map((l) => l.getAttribute('href') ?? '')
      .filter((h) => h.startsWith('/projects/'));

    expect(slugs.indexOf('/projects/compute-atlas')).toBeGreaterThanOrEqual(0);
    expect(slugs.indexOf('/projects/compute-atlas')).toBeLessThan(
      slugs.indexOf('/projects/cast-claude-agent-team')
    );
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

describe('FeaturedWork — tool cards', () => {
  it('renders ≥3 /projects/:slug links (one per tool card at minimum)', () => {
    renderFeaturedWork();
    const allLinks = screen.getAllByRole('link');
    const projectLinks = allLinks.filter(
      (l) => /^\/projects\/.+/.test(l.getAttribute('href') ?? '')
    );
    // flagship (1) + tools (4) = ≥5 total; require at least 3 so the test
    // does not break if the flagship is temporarily absent from the data
    expect(projectLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the four tool cards in order, each linking to its project page', () => {
    renderFeaturedWork();
    const expected = [
      ['looptrip', 'looptrip'],
      ['misfire', 'misfire'],
      ['Attest', 'attest'],
      ['tin-can', 'tin-can'],
    ];
    const links = expected.map(([title]) =>
      screen.getByRole('link', { name: new RegExp(`View project: ${title}`) })
    );
    links.forEach((link, i) => {
      expect(link).toHaveAttribute('href', `/projects/${expected[i][1]}`);
    });
    const labels = ['03', '04', '05', '06'];
    links.forEach((link, i) => {
      const card = link.closest('article');
      expect(card).not.toBeNull();
      expect(within(card).getByText(labels[i])).toBeInTheDocument();
    });
    for (let i = 1; i < links.length; i++) {
      expect(links[i - 1].compareDocumentPosition(links[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
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
    // Tool cards may or may not have live-demo links; validate only those present
    externalLinks.forEach((link) => {
      expect(link.rel).toContain('noopener');
      expect(link.rel).toContain('noreferrer');
    });
  });
});
