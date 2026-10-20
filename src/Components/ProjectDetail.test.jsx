/**
 * ProjectDetail.test.jsx — the access degrade path.
 *
 * Three of the four professional projects are internal: private source, no
 * shareable URL. Without an explicit degrade path the detail page renders no
 * out-links and no explanation for their absence, which reads as an unfinished
 * page. These tests pin the explanation, not the copy — they assert that
 * *something* stands in for the missing links, and that a project which DOES
 * have links never shows the internal affordance.
 *
 * Tests drive real project slugs through the router so the assertions exercise
 * the same data the site ships.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectDetail from './ProjectDetail';
import projects from '../data/projects';

// StarBadge fetches live GitHub stars — mock so tests don't hit the network.
vi.mock('../hooks/useGitHubStars', () => ({
  useGitHubStars: () => ({ stars: null, loading: false }),
}));

function renderProject(slug) {
  return render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes>
        <Route path="/projects/:slug" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

const internal = projects.filter((p) => !p.github && !p.link);
const linked = projects.filter((p) => p.github || p.link);

describe('ProjectDetail — internal projects explain the missing links', () => {
  it('has at least one project with no out-links (guard: the case is real)', () => {
    expect(internal.length).toBeGreaterThan(0);
  });

  it.each(internal.map((p) => [p.slug]))(
    '%s renders the internal chip and an Access panel',
    (slug) => {
      renderProject(slug);
      expect(screen.getByText(/no public repo/i)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /^access$/i })
      ).toBeInTheDocument();
    }
  );

  it('renders no out-links when there is nothing to link', () => {
    const { container } = renderProject(internal[0].slug);
    expect(container.querySelector('a[target="_blank"]')).toBeNull();
  });

  it("uses the project's own accessNote when it supplies one", () => {
    const withNote = internal.find((p) => p.accessNote);
    expect(withNote).toBeDefined();
    renderProject(withNote.slug);
    expect(screen.getByText(withNote.accessNote)).toBeInTheDocument();
  });
});

describe('ProjectDetail — linked projects are unaffected', () => {
  it('has at least one project with out-links (guard: the control is real)', () => {
    expect(linked.length).toBeGreaterThan(0);
  });

  it.each(linked.map((p) => [p.slug]))(
    '%s shows out-links and no internal chip',
    (slug) => {
      const view = renderProject(slug);
      const { container } = view;
      expect(container.querySelector('a[target="_blank"]')).not.toBeNull();
      expect(screen.queryByText(/no public repo/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: /^access$/i })
      ).not.toBeInTheDocument();
    }
  );
});

describe('CWS — the one shareable work URL', () => {
  // The header carries the single live-site link; it must point at the
  // customizations site and open safely in a new tab.
  it('links the live customizations site from the header', () => {
    renderProject('cws');
    const live = screen.getAllByRole('link', { name: /live site/i });
    expect(live).toHaveLength(1);
    expect(live[0]).toHaveAttribute(
      'href',
      'https://customizations.metasolutions.net/'
    );
    expect(live[0]).toHaveAttribute('target', '_blank');
    expect(live[0]).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(live[0]).toHaveAccessibleName(/\(opens in new tab\)$/);
  });
});

describe('ProjectDetail — citedBy', () => {
  it('renders each citation as an external link on compute-atlas', () => {
    renderProject('compute-atlas');
    expect(
      screen.getByRole('heading', { name: /^cited by$/i })
    ).toBeInTheDocument();
    const expected = {
      'https://brockovichdatacenter.com': [/brockovich/i, 'compiled from Compute Atlas and Epoch AI'],
      'https://powertothepeopleproject.com': [/power to the people/i, 'Compute Atlas open facility registry'],
    };
    Object.entries(expected).forEach(([href, [name, detail]]) => {
      const link = screen.getByRole('link', {
        name: new RegExp(`${name.source}.*\\(opens in new tab\\)`, 'i'),
      });
      expect(link).toHaveAttribute('href', href);
      expect(link.closest('li')).toHaveTextContent(detail);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });
  });

  it('renders no Cited by block for a project without the field', () => {
    const without = projects.find((p) => !p.citedBy);
    renderProject(without.slug);
    expect(
      screen.queryByRole('heading', { name: /^cited by$/i })
    ).not.toBeInTheDocument();
  });
});

describe('ProjectDetail — console case study (compute-atlas)', () => {
  it('uses no "Plate" wording', () => {
    const { container } = renderProject('compute-atlas');
    expect(container.textContent).not.toMatch(/plate/i);
  });

  it('renders case-study sections with "01 /"-style mono indices', () => {
    renderProject('compute-atlas');
    const atlas = projects.find((p) => p.slug === 'compute-atlas');
    expect(screen.getByText('01 /')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: atlas.sections[0].title })
    ).toBeInTheDocument();
  });

  it('serves the hero via <picture> with a webp source and png fallback', () => {
    const { container } = renderProject('compute-atlas');
    const source = container.querySelector('picture source');
    expect(source).toHaveAttribute('type', 'image/webp');
    expect(source.getAttribute('srcset')).toMatch(/\.webp$/);
    expect(container.querySelector('picture img')).toHaveAttribute('src', expect.stringMatching(/\.png$/));
  });

  it('has exactly one h1', () => {
    renderProject('compute-atlas');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('ProjectDetail — a11y structure (compute-atlas)', () => {
  it('puts each readout <dt> before its <dd>', () => {
    const { container } = renderProject('compute-atlas');
    const groups = container.querySelectorAll('dl > div');
    expect(groups.length).toBeGreaterThan(0);
    groups.forEach((g) => {
      const kids = Array.from(g.children).map((c) => c.tagName);
      expect(kids.indexOf('DT')).toBeLessThan(kids.indexOf('DD'));
    });
  });

  it('labels every <section> by its heading', () => {
    const { container } = renderProject('compute-atlas');
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(0);
    sections.forEach((sec) => {
      const id = sec.getAttribute('aria-labelledby');
      expect(id).toBeTruthy();
      const target = container.querySelector(`#${id}`);
      expect(target).not.toBeNull();
      expect(target.tagName).toMatch(/^H[1-6]$/);
    });
  });

  it('declares the hero at its real 1600x1000 size', () => {
    const { container } = renderProject('compute-atlas');
    const img = container.querySelector('picture img');
    expect(img).toHaveAttribute('width', '1600');
    expect(img).toHaveAttribute('height', '1000');
  });

  it('names the GitHub link with its visible word order', () => {
    renderProject('compute-atlas');
    expect(
      screen.getByRole('link', { name: 'Source on GitHub (opens in new tab)' })
    ).toHaveTextContent('Source');
  });
});

describe('ProjectDetail — dataset DOI link', () => {
  it('links the Zenodo DOI on compute-atlas with a label-in-name accessible name', () => {
    renderProject('compute-atlas');
    const { doiUrl } = projects.find((p) => p.slug === 'compute-atlas').dataset;
    const link = screen.getByRole('link', {
      name: 'Dataset DOI on Zenodo (opens in new tab)',
    });
    expect(link).toHaveAttribute('href', doiUrl);
    expect(link.getAttribute('href')).toMatch(/^https:\/\/doi\.org\/10\./);
    expect(link).toHaveTextContent('Dataset DOI');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders no dataset link for a project without the field', () => {
    const without = projects.find((p) => !p.dataset && p.github);
    renderProject(without.slug);
    expect(screen.queryByRole('link', { name: /^dataset doi/i })).not.toBeInTheDocument();
  });
});
