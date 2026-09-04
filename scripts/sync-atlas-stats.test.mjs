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

  it("falls back to the static VERSION constant when raw has no edition, and attaches the static stack/license constants", () => {
    const result = deriveAtlasStats(RAW);
    expect(result.version).toBe("v1.29.0");
    expect(result.stack).toBe(
      "Next.js 16 · React 19 · TypeScript · MapLibre GL · Neon Postgres · Drizzle · Vercel",
    );
    expect(result.license).toBe("MIT + CC BY 4.0");
  });

  it("derives version from raw.edition.version, normalized to a leading v", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "1.30.0" } });
    expect(result.version).toBe("v1.30.0");
  });

  it("does not double-prefix an edition.version that already has a leading v", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "v1.30.0" } });
    expect(result.version).toBe("v1.30.0");
  });

  it("normalizes a capital-V prefix to lowercase v, without double-prefixing", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "V1.30.0" } });
    expect(result.version).toBe("v1.30.0");
  });

  it("trims surrounding whitespace on an edition.version with no v prefix", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "  1.30.0  " } });
    expect(result.version).toBe("v1.30.0");
  });

  it("trims surrounding whitespace on an edition.version that already has a v prefix", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "  v1.30.0  " } });
    expect(result.version).toBe("v1.30.0");
  });

  it("preserves the case of a pre-release tag while normalizing only the v prefix", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "1.30.0-RC1" } });
    expect(result.version).toBe("v1.30.0-RC1");
  });

  it.each([
    ["missing version key", {}],
    ["empty string version", { version: "" }],
    ["non-string version", { version: 1.3 }],
  ])("falls back to the static VERSION constant when edition has %s", (_label, edition) => {
    const result = deriveAtlasStats({ ...RAW, edition });
    expect(result.version).toBe("v1.29.0");
  });

  it("still attaches the static stack/license constants when edition is present", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "1.30.0" } });
    expect(result.stack).toBe(
      "Next.js 16 · React 19 · TypeScript · MapLibre GL · Neon Postgres · Drizzle · Vercel",
    );
    expect(result.license).toBe("MIT + CC BY 4.0");
  });
});
