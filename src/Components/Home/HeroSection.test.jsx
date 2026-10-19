/**
 * HeroSection.test.jsx — render tests for the hero and its reserved facility-field slot.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroSection from "./HeroSection";
import { ATLAS_STATS } from "../../data/atlasStats";

const renderHero = () => render(<MemoryRouter><HeroSection /></MemoryRouter>);

describe("HeroSection", () => {
  it("renders a single h1 with the name", () => {
    renderHero();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Edward Kubiak" })).toBeInTheDocument();
  });

  it("links the primary CTAs", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /view work/i })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: /how i work with agents/i })).toHaveAttribute("href", "/practice");
  });
});

describe("HeroSection — facility-field slot", () => {
  it("reserves a fixed-aspect, aria-hidden body for the canvas", () => {
    const { container } = renderHero();
    const slot = container.querySelector('[data-slot="facility-field"]');
    expect(slot).toBeInTheDocument();
    expect(slot).toHaveAttribute("aria-hidden", "true");
    expect(slot.className).toContain("aspect-[4/3]");
  });

  it("keeps the coverage caption outside the aria-hidden body so it stays readable", () => {
    const { container } = renderHero();
    const slot = container.querySelector('[data-slot="facility-field"]');
    const caption = screen.getByText(ATLAS_STATS.coverage);
    expect(slot.contains(caption)).toBe(false);
    expect(caption.closest('[aria-hidden="true"]')).toBeNull();
  });
});
