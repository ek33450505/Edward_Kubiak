import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Practice from './Practice';
import practice from '../data/practice';
import { CAST_STATS } from '../data/castStats.js';

function renderPractice() {
  return render(
    <MemoryRouter>
      <Practice />
    </MemoryRouter>
  );
}

describe('Practice — page heading', () => {
  it('renders exactly one h1, with the expected text', () => {
    renderPractice();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('How I Work With Agents');
  });
});

describe('Practice — the loop', () => {
  it('renders every loop step title', () => {
    renderPractice();
    practice.loop.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  it('renders plate numbering zero-padded starting at 01', () => {
    renderPractice();
    expect(screen.getAllByText('01').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Practice — case studies', () => {
  it('renders every case study title as an h3 (nested under the section h2)', () => {
    renderPractice();
    practice.cases.forEach((c) => {
      expect(screen.getByRole('heading', { level: 3, name: c.title })).toBeInTheDocument();
    });
  });

  it('renders every case study lesson', () => {
    renderPractice();
    practice.cases.forEach((c) => {
      expect(screen.getByText(c.lesson)).toBeInTheDocument();
    });
  });
});

describe('Practice — live stats (Data-Point Discipline)', () => {
  it('renders a CAST_STATS-derived figure sourced from the live import, not a literal', () => {
    renderPractice();
    // Assert against the live import so this test tracks stat resyncs
    // instead of breaking on every one (never hardcode the expected string).
    expect(screen.getByText(CAST_STATS.tests.toLocaleString('en-US'))).toBeInTheDocument();
    expect(screen.getByText(`${CAST_STATS.agents}`)).toBeInTheDocument();
  });
});

describe('Practice — navigation links', () => {
  it('links to /projects, /resume, and /about with correct hrefs', () => {
    renderPractice();
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/resume');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });
});
