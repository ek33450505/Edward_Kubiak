import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Now from './Now';
import now from '../data/now';

function renderNow() {
  return render(
    <MemoryRouter>
      <Now />
    </MemoryRouter>
  );
}

describe('Now', () => {
  it('renders one h1 and an h2 per data section', () => {
    renderNow();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    now.sections.forEach((section) => {
      expect(screen.getByRole('heading', { level: 2, name: section.title })).toBeInTheDocument();
    });
  });

  it('labels each section region by its heading', () => {
    renderNow();
    now.sections.forEach((section) => {
      expect(screen.getByRole('region', { name: section.title })).toBeInTheDocument();
    });
  });

  it('renders every item and the updated date', () => {
    renderNow();
    now.sections.forEach((section) => {
      section.items.forEach((item) => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
    expect(screen.getAllByText(now.updated)).toHaveLength(1);
  });
});
