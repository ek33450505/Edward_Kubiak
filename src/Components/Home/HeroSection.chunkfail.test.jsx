/**
 * A failed FacilityField chunk load (stale tab after a deploy) must degrade to the dot grid,
 * never reach the route ErrorBoundary.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroSection, { loadFacilityField } from "./HeroSection";
import { ATLAS_POINTS } from "../../data/atlasPoints";

vi.mock("./FacilityField", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

describe("HeroSection — chunk load failure", () => {
  it("loadFacilityField resolves to a component that renders nothing", async () => {
    const { default: Fallback } = await loadFacilityField();
    expect(Fallback()).toBeNull();
  });

  it("still renders the h1, legend and placeholder after the mount delay", async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<MemoryRouter><HeroSection /></MemoryRouter>);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      expect(screen.getByRole("heading", { level: 1, name: "Edward Kubiak" })).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Facility status legend" })).toBeInTheDocument();
      expect(screen.getByText(`${ATLAS_POINTS.count.toLocaleString("en-US")} sites`)).toBeInTheDocument();
      expect(container.querySelector('[data-slot="facility-field"]')).toBeInTheDocument();
      expect(container.querySelector("canvas")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
