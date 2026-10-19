import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from './About';
import { aggregateTech } from '../utils/aggregateTech';

function renderAbout() {
  return render(
    <MemoryRouter>
      <About />
    </MemoryRouter>
  );
}

describe('About — personal-life cards removed', () => {
  it('has no Family or Trail Runner card', () => {
    renderAbout();
    expect(screen.queryByRole('heading', { name: /^family$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^trail runner$/i })).not.toBeInTheDocument();
  });

  it('replaces the location card with "How I Work"', () => {
    renderAbout();
    expect(screen.getByRole('heading', { name: /^how i work$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /columbus/i })).not.toBeInTheDocument();
  });
});

describe('About — stack list (honest tag counts)', () => {
  it('lists tags sorted by count with counts matching aggregateTech()', () => {
    renderAbout();
    const data = aggregateTech();
    expect(data.length).toBeGreaterThan(0);
    const section = screen.getByRole('region', { name: /^stack$/i });
    const rows = within(section).getAllByRole('listitem');
    expect(rows).toHaveLength(data.length);
    rows.forEach((row, i) => {
      expect(row).toHaveTextContent(data[i].name);
      expect(within(row).getByText(String(data[i].count), { exact: true })).toBeInTheDocument();
    });
    const counts = data.map((d) => d.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('makes no proficiency claim and ships no radar', () => {
    const { container } = renderAbout();
    expect(container).not.toHaveTextContent(/proficien/i);
    expect(container.querySelector('svg[role="img"]')).toBeNull();
  });

  it('flags the META Solutions link as opening in a new tab', () => {
    renderAbout();
    expect(screen.getByRole('link', { name: /META Solutions \(opens in new tab\)/ })).toHaveAttribute('target', '_blank');
  });
});
