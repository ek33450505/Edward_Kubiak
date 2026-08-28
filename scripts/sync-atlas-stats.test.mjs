import { describe, it, expect } from "vitest";

import { deriveAtlasStats } from "./sync-atlas-stats.mjs";

// Raw input in the shape the live /api/stats endpoint actually returns —
// fractional megawatts, so the rounding assertions below exercise real rounding
// rather than passing trivially on pre-rounded integers. Pure helper, no network.
const RAW = {
  count: 1231,
  states: 50,
  operationalMw: 26519.439999999995,
  plannedMw: 313507.5,
  underConstructionMw: 107471.2,
};

describe("deriveAtlasStats", () => {
  it("maps count/states through unchanged", () => {
    const result = deriveAtlasStats(RAW);
    expect(result.facilities).toBe(1231);
    expect(result.states).toBe(50);
  });

  it("derives Gw fields rounded to one decimal", () => {
    const result = deriveAtlasStats(RAW);
    expect(result.operationalGw).toBe(26.5);
    expect(result.underConstructionGw).toBe(107.5);
    expect(result.plannedGw).toBe(313.5);
  });

  it("rounds fractional Mw fields to whole numbers", () => {
    const result = deriveAtlasStats(RAW);
    expect(result.operationalMw).toBe(26519);
    expect(result.underConstructionMw).toBe(107471);
    expect(result.plannedMw).toBe(313508);
  });

  it("attaches the static version/stack/license constants", () => {
    const result = deriveAtlasStats(RAW);
    expect(result.version).toBe("v1.29.0");
    expect(result.stack).toBe(
      "Next.js 16 · React 19 · TypeScript · MapLibre GL · Neon Postgres · Drizzle · Vercel",
    );
    expect(result.license).toBe("MIT + CC BY 4.0");
  });
});
