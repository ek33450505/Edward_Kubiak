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
    '%s renders the internal chip and an Access plate',
    (slug) => {
      renderProject(slug);
      expect(screen.getByText(/no public repo/i)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /^access$/i })
      ).toBeInTheDocument();
    }
  );

  it('renders no Links panel when there is nothing to link', () => {
    renderProject(internal[0].slug);
    expect(
      screen.queryByRole('heading', { name: /^links$/i })
    ).not.toBeInTheDocument();
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
    '%s shows the Links panel and no internal chip',
    (slug) => {
      renderProject(slug);
      expect(
        screen.getByRole('heading', { name: /^links$/i })
      ).toBeInTheDocument();
      expect(screen.queryByText(/no public repo/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: /^access$/i })
      ).not.toBeInTheDocument();
    }
  );
});

describe('CWS — the one shareable work URL', () => {
  // Two links carry the live URL — the hero icon button and the Links panel.
  // Both must point at the same place, so assert over all of them rather than
  // picking one and letting the other drift.
  it('links the live customizations site from every live-site affordance', () => {
    renderProject('cws');
    const live = screen.getAllByRole('link', { name: /live site/i });
    expect(live).toHaveLength(2);
    live.forEach((el) => {
      expect(el).toHaveAttribute(
        'href',
        'https://customizations.metasolutions.net/'
      );
      expect(el).toHaveAttribute('target', '_blank');
      expect(el).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });
  });
});
