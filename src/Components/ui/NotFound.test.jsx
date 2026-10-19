/**
 * NotFound.test.jsx — behavioral render tests for the shared 404 panel.
 *
 * Covers: default props, custom props, a11y basics.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

function renderNotFound(props = {}) {
  return render(
    <MemoryRouter>
      <NotFound {...props} />
    </MemoryRouter>
  );
}

describe('NotFound — default props', () => {
  it('renders the default "404" heading display text', () => {
    renderNotFound();
    expect(screen.getByRole('heading', { level: 1, name: /^404/ })).toBeInTheDocument();
  });

  it('renders "404 — Page not found" as the h1 and the explanation as a paragraph', () => {
    renderNotFound();
    expect(
      screen.getByRole('heading', { level: 1, name: /404.*page not found/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument();
  });

  it('renders a "Back to Home" link pointing to "/"', () => {
    renderNotFound();
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/');
  });
});

describe('NotFound — custom props', () => {
  it('renders custom heading, message and link label/href', () => {
    renderNotFound({
      heading: '404',
      title: 'Project not found',
      message: "The project you're looking for doesn't exist.",
      linkLabel: 'Back to Projects',
      linkHref: '/projects',
    });
    expect(screen.getByRole('heading', { level: 1, name: /^404/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /404.*project not found/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/project you're looking for doesn't exist/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /back to projects/i });
    expect(link.getAttribute('href')).toBe('/projects');
  });
});
