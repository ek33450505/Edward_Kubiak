import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

  it('renders panel indices from 01', () => {
    renderPractice();
    // Scoped to each loop panel so the SectionHead "01 /" can't satisfy it.
    practice.loop.forEach((step, i) => {
      const panel = screen.getByRole('region', { name: step.title });
      expect(within(panel).getByText(`${String(i + 1).padStart(2, '0')} /`)).toBeInTheDocument();
    });
  });
});

describe('Practice — case studies', () => {
  it('renders every case study title as an h3 (nested under the section h2)', () => {
    renderPractice();
    practice.cases.forEach((c) => {
      expect(screen.getByRole('heading', { level: 3, name: c.title })).toBeInTheDocument();
    });
  });

  it('labels each case article by its h3', () => {
    renderPractice();
    practice.cases.forEach((c) => {
      expect(screen.getByRole('article', { name: c.title })).toBeInTheDocument();
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

describe('Practice — the lede counts the cases it promises', () => {
  // Reading two artifacts against each other: the prose number and the array length.
  // A description that keeps asserting the old world is the exact defect this page is about.
  const NUMBER_WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six',
    'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  ];

  it('names the same number of case studies as it ships', () => {
    const expected = NUMBER_WORDS[practice.cases.length];
    expect(expected, `no number word for ${practice.cases.length} cases`).toBeDefined();
    expect(practice.lede).toContain(`${expected} times the output looked right`);
  });

  it('gives every case a unique id and a dated provenance line', () => {
    const ids = practice.cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    practice.cases.forEach((c) => {
      expect(c.provenance, `${c.id} provenance`).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  it('closes on the verification-tooling case, per the page\'s intended arc', () => {
    expect(practice.cases.at(-1).id).toBe('existence-not-identity');
  });
});
