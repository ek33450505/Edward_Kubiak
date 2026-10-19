/**
 * HeroSection.test.jsx — render tests for the hero and its reserved facility-field slot.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroSection from "./HeroSection";
import { ATLAS_STATS } from "../../data/atlasStats";
import { ATLAS_POINTS } from "../../data/atlasPoints";
import { statusLabel } from "../../lib/facilityField";

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
  it("reserves an aria-hidden body whose aspect ratio follows the data layout", () => {
    const { container } = renderHero();
    const slot = container.querySelector('[data-slot="facility-field"]');
    expect(slot).toBeInTheDocument();
    expect(slot).toHaveAttribute("aria-hidden", "true");
    expect(slot.style.aspectRatio.replace(/\s/g, "")).toBe(`${ATLAS_POINTS.w}/${ATLAS_POINTS.h}`);
  });

  it("keeps the coverage caption outside the aria-hidden body so it stays readable", () => {
    const { container } = renderHero();
    const slot = container.querySelector('[data-slot="facility-field"]');
    const caption = screen.getByText(ATLAS_STATS.coverage);
    expect(slot.contains(caption)).toBe(false);
    expect(caption.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("shows the panel count from the points summary", () => {
    renderHero();
    expect(screen.getByText(`${ATLAS_POINTS.count.toLocaleString("en-US")} sites`)).toBeInTheDocument();
  });

  it("lists all five statuses with their counts", () => {
    renderHero();
    const items = within(screen.getByRole("list", { name: "Facility status legend" })).getAllByRole("listitem");
    expect(items).toHaveLength(Object.keys(ATLAS_POINTS.byStatus).length);
    Object.entries(ATLAS_POINTS.byStatus).forEach(([name, n], i) => {
      expect(items[i]).toHaveTextContent(statusLabel(name));
      expect(within(items[i]).getByText(n.toLocaleString("en-US"))).toBeInTheDocument();
    });
  });

  it("links to the live map in a new tab", () => {
    renderHero();
    const link = screen.getByRole("link", { name: "Explore the live map (opens in new tab)" });
    expect(link).toHaveAttribute("href", "https://www.compute-atlas.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("describes the map for screen readers outside the aria-hidden slot", () => {
    const { container } = renderHero();
    const slot = container.querySelector('[data-slot="facility-field"]');
    const sentence = screen.getByText(/Map of .* Compute Atlas facilities, colored by status as listed below\./);
    expect(sentence).toHaveClass("sr-only");
    expect(sentence).toHaveTextContent(ATLAS_POINTS.count.toLocaleString("en-US"));
    expect(slot.contains(sentence)).toBe(false);
  });
});
