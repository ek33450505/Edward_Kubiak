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
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders the default page-not-found h1 message', () => {
    renderNotFound();
    expect(
      screen.getByRole('heading', { level: 1, name: /doesn't exist/i })
    ).toBeInTheDocument();
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
      message: 'Project not found',
      linkLabel: 'Back to Projects',
      linkHref: '/projects',
    });
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /project not found/i })
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /back to projects/i });
    expect(link.getAttribute('href')).toBe('/projects');
  });
});
