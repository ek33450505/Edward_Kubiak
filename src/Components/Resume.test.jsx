import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Resume from './Resume';
import {
  skills,
  experience,
  education,
  earlierCareer,
  aiPractice,
  summary,
} from '../data/resume';
import practice from '../data/practice.js';

function renderResume() {
  return render(
    <MemoryRouter>
      <Resume />
    </MemoryRouter>
  );
}

describe('Resume — page heading and contact', () => {
  it('renders exactly one h1, naming Edward Kubiak', () => {
    renderResume();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('Edward Kubiak');
  });

  it('offers both PDF downloads with accessible labels', () => {
    renderResume();
    expect(
      screen.getByRole('link', { name: /download resume pdf/i })
    ).toHaveAttribute('href', '/Edward_Kubiak_Resume.pdf');
    expect(
      screen.getByRole('link', { name: /download cast one-pager pdf/i })
    ).toHaveAttribute('href', '/CAST_Portfolio_OnePager.pdf');
  });
});

describe('Resume — summary', () => {
  it('renders the summary prose from the data module', () => {
    renderResume();
    expect(screen.getByText(summary)).toBeInTheDocument();
  });
});

describe('Resume — experience', () => {
  it('renders every role and company', () => {
    renderResume();
    experience.forEach((job) => {
      expect(screen.getByRole('heading', { name: job.role })).toBeInTheDocument();
      expect(
        screen.getAllByText(
          new RegExp(job.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        ).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it('leads with the professional role, not the open-source work', () => {
    renderResume();
    const roleNames = new Set(experience.map((job) => job.role));
    const roleHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
      .filter((text) => roleNames.has(text));
    expect(roleHeadings).toEqual(experience.map((job) => job.role));
    expect(experience[0].company).toBe('META Solutions');
  });

  it('renders per-role tech tags for every role that declares them', () => {
    renderResume();
    experience.forEach((job) => {
      (job.tech ?? []).forEach((tag) => {
        expect(screen.getAllByText(tag).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it('renders every highlight bullet', () => {
    renderResume();
    experience.forEach((job) => {
      job.highlights.forEach((h) => {
        expect(screen.getByText(h)).toBeInTheDocument();
      });
    });
  });
});

describe('Resume — earlier career', () => {
  it('renders the framing note and both pre-engineering roles', () => {
    renderResume();
    expect(screen.getByText(earlierCareer.note)).toBeInTheDocument();
    earlierCareer.roles.forEach((job) => {
      expect(screen.getByText(job.role)).toBeInTheDocument();
      expect(screen.getByText(job.period)).toBeInTheDocument();
    });
  });

  it('closes the timeline between the degree and the certificate era', () => {
    const periods = earlierCareer.roles.map((r) => r.period);
    expect(periods).toContain('September 2020 — August 2022');
    expect(periods).toContain('March 2013 — June 2020');
  });
});

describe('Resume — AI practice block', () => {
  it('renders every condensed practice line', () => {
    renderResume();
    aiPractice.items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('derives its lines from practice.js so the page and PDF cannot diverge', () => {
    const fromPractice = [
      ...practice.loop.filter((s) => s.resumeLine).map((s) => s.resumeLine),
      ...practice.principles.filter((p) => p.resumeLine).map((p) => p.resumeLine),
    ];
    expect(aiPractice.items).toEqual(fromPractice);
    expect(aiPractice.items.length).toBeGreaterThan(0);
  });
});

describe('Resume — skills and education', () => {
  it('renders every skill category heading', () => {
    renderResume();
    Object.keys(skills).forEach((category) => {
      expect(screen.getByText(category)).toBeInTheDocument();
    });
  });

  it('renders every education entry', () => {
    renderResume();
    education.forEach((edu) => {
      expect(screen.getByText(edu.degree)).toBeInTheDocument();
      expect(screen.getByText(edu.institution)).toBeInTheDocument();
    });
  });
});

describe('Resume — claim discipline', () => {
  const blob = JSON.stringify({ experience, skills, summary });

  it.each([
    ['AG Grid', 'AG Grid'],
    ['MUI', 'MUI'],
    ['MongoDB', 'MongoDB'],
    ['mongoose', 'mongoose'],
  ])('does not claim %s — verified absent from every repo Ed owns', (_label, needle) => {
    expect(blob).not.toContain(needle);
  });

  it.each([
    ['launched publicly', 'launched publicly'],
    ['full test coverage', 'full test coverage'],
    ['go-to resource', 'go-to resource'],
  ])('does not carry the retired claim %s', (_label, needle) => {
    expect(blob).not.toContain(needle);
  });

  it('does not publish the E-Rate unauthenticated write-path finding', () => {
    expect(blob).not.toContain('unauthenticated');
  });

  it('says "opened to districts", never "launched publicly", about CrossCheck', () => {
    expect(blob).toContain('opened to districts');
  });
});

describe('Resume — see also nav', () => {
  it('links to Now, Projects and Practice', () => {
    renderResume();
    const nav = screen.getByRole('navigation', { name: /see also/i });
    ['Now', 'Projects', 'Practice'].forEach((label) => {
      expect(
        screen.getByRole('link', { name: label })
      ).toBeInTheDocument();
    });
    expect(nav).toBeInTheDocument();
  });
});
