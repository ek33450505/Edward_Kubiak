/**
 * HeroStats.test.jsx — behavioral render tests for the hero survey strip.
 *
 * Covers: label set, value sourcing from CAST_STATS/ATLAS_STATS, and
 *         regression guards for the removed "Stars" cell and the
 *         relabeled "Taps" -> "Packages" cell.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HeroStats from "./HeroStats";
import { CAST_STATS } from "../data/castStats";
import { ATLAS_STATS } from "../data/atlasStats";

describe("HeroStats — labels", () => {
  it("renders all four expected labels", () => {
    render(<HeroStats />);
    expect(screen.getByText("Tests")).toBeInTheDocument();
    expect(screen.getByText("Facilities")).toBeInTheDocument();
    expect(screen.getByText("Packages")).toBeInTheDocument();
    expect(screen.getByText("CAST")).toBeInTheDocument();
  });

  it("does not render the removed 'Stars' cell", () => {
    render(<HeroStats />);
    expect(screen.queryByText("Stars")).not.toBeInTheDocument();
  });

  it("does not render the retired 'Taps' label", () => {
    render(<HeroStats />);
    expect(screen.queryByText("Taps")).not.toBeInTheDocument();
  });
});

describe("HeroStats — values", () => {
  it("renders the Tests value from CAST_STATS.tests", () => {
    render(<HeroStats />);
    expect(
      screen.getByText(CAST_STATS.tests.toLocaleString("en-US"))
    ).toBeInTheDocument();
  });

  it("renders the Facilities value from ATLAS_STATS.facilities", () => {
    render(<HeroStats />);
    expect(
      screen.getByText(ATLAS_STATS.facilities.toLocaleString("en-US"))
    ).toBeInTheDocument();
  });

  it("renders the Packages value from CAST_STATS.packages", () => {
    render(<HeroStats />);
    expect(screen.getByText(`${CAST_STATS.packages}`)).toBeInTheDocument();
  });

  it("renders the CAST value from CAST_STATS.version", () => {
    render(<HeroStats />);
    expect(screen.getByText(CAST_STATS.version)).toBeInTheDocument();
  });
});
