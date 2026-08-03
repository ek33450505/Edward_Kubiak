import { describe, it, expect } from "vitest";

import { deriveAtlasStats } from "./sync-atlas-stats.mjs";

// FALLBACK-shaped raw input (mirrors the script's offline/first-run constant) —
// pure helper, no network involved.
const FALLBACK_RAW = {
  count: 760,
  states: 50,
  operationalMw: 11039,
  plannedMw: 194994,
  underConstructionMw: 83479,
};

describe("deriveAtlasStats", () => {
  it("maps count/states through unchanged", () => {
    const result = deriveAtlasStats(FALLBACK_RAW);
    expect(result.facilities).toBe(760);
    expect(result.states).toBe(50);
  });

  it("derives Gw fields rounded to one decimal", () => {
    const result = deriveAtlasStats(FALLBACK_RAW);
    expect(result.operationalGw).toBe(11);
    expect(result.underConstructionGw).toBe(83.5);
    expect(result.plannedGw).toBe(195);
  });

  it("rounds Mw fields to whole numbers", () => {
    const result = deriveAtlasStats(FALLBACK_RAW);
    expect(result.operationalMw).toBe(11039);
    expect(result.underConstructionMw).toBe(83479);
    expect(result.plannedMw).toBe(194994);
  });

  it("attaches the static version/stack/license constants", () => {
    const result = deriveAtlasStats(FALLBACK_RAW);
    expect(result.version).toBe("v1.14.0");
    expect(result.stack).toBe("Next.js 16 · React 19 · TypeScript · Neon Postgres · Vercel");
    expect(result.license).toBe("MIT + CC BY 4.0");
  });
});
