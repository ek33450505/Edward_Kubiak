import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from './About';

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
