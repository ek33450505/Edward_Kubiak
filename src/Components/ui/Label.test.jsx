/**
 * Label.test.jsx — behavioral render tests for the shared Label primitive.
 *
 * Covers: default element, custom element, text content, className merge,
 *         forwarded props (id, aria-label).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Label from './Label';

describe('Label — default rendering', () => {
  it('renders children text', () => {
    render(<Label>Skills</Label>);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('renders as a span by default', () => {
    const { container } = render(<Label>Skills</Label>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('applies the base uppercase display classes', () => {
    const { container } = render(<Label>Skills</Label>);
    const el = container.querySelector('span');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('uppercase');
    expect(el.className).toContain('text-muted-foreground');
  });
});

describe('Label — custom element via `as` prop', () => {
  it('renders as h2 when as="h2"', () => {
    render(<Label as="h2">Experience</Label>);
    expect(screen.getByRole('heading', { level: 2, name: /experience/i })).toBeInTheDocument();
  });

  it('renders as p when as="p"', () => {
    const { container } = render(<Label as="p">Caption</Label>);
    expect(container.querySelector('p')).toBeInTheDocument();
  });
});

describe('Label — className merge', () => {
  it('appends extra className after base classes', () => {
    const { container } = render(<Label className="mt-4">Extra</Label>);
    const el = container.querySelector('span');
    expect(el.className).toContain('mt-4');
    expect(el.className).toContain('font-mono');
  });
});

describe('Label — forwarded props', () => {
  it('forwards id prop', () => {
    const { container } = render(<Label id="skills-label">Skills</Label>);
    expect(container.querySelector('#skills-label')).toBeInTheDocument();
  });

  it('forwards aria-label prop', () => {
    render(<Label aria-label="Skills section">Skills</Label>);
    expect(screen.getByLabelText('Skills section')).toBeInTheDocument();
  });
});
