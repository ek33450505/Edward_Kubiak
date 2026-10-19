import { describe, it, expect } from "vitest";

import { FALLBACK, deriveAtlasStats, isValidRaw, selectSource } from "./sync-atlas-stats.mjs";

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

const FIFTY = (
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT " +
  "NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY"
).split(" ");

describe("deriveAtlasStats coverage", () => {
  it("splits 50 states + DC + 4 territories from stateCodes", () => {
    const stateCodes = [...FIFTY, "DC", "GU", "MP", "PR", "VI"];
    const result = deriveAtlasStats({ ...RAW, states: 55, stateCodes });
    expect(result.states).toBe(50);
    expect(result.hasDc).toBe(true);
    expect(result.territories).toBe(4);
    expect(result.jurisdictions).toBe(55);
    expect(result.coverage).toBe("50 states, DC and 4 territories");
  });

  it("omits DC and territories when absent", () => {
    const result = deriveAtlasStats({ ...RAW, states: 48, stateCodes: FIFTY.slice(0, 48) });
    expect(result.states).toBe(48);
    expect(result.hasDc).toBe(false);
    expect(result.territories).toBe(0);
    expect(result.coverage).toBe("48 states");
  });

  it("phrases states + DC without territories", () => {
    const result = deriveAtlasStats({ ...RAW, states: 51, stateCodes: [...FIFTY, "DC"] });
    expect(result.coverage).toBe("50 states and DC");
  });

  it("uses the singular for one territory", () => {
    const result = deriveAtlasStats({ ...RAW, states: 51, stateCodes: [...FIFTY, "PR"] });
    expect(result.territories).toBe(1);
    expect(result.coverage).toBe("50 states and 1 territory");
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["non-array", "AL,AK"],
    ["a different length than states", [...FIFTY, "DC", "GU"]],
  ])("takes the conservative path when stateCodes is %s", (_label, stateCodes) => {
    const result = deriveAtlasStats({ ...RAW, states: 55, stateCodes });
    expect(result.states).toBeNull();
    expect(result.hasDc).toBe(false);
    expect(result.territories).toBe(0);
    expect(result.jurisdictions).toBe(55);
    expect(result.coverage).toBe("55 U.S. jurisdictions");
  });
});

describe("deriveAtlasStats", () => {
  it("maps count through unchanged; states is null without consistent stateCodes", () => {
    const result = deriveAtlasStats(RAW);
    expect(result.facilities).toBe(1231);
    expect(result.states).toBeNull();
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
    expect(result.version).toBe("v1.34.1");
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
    expect(result.version).toBe("v1.34.1");
  });

  it("still attaches the static stack/license constants when edition is present", () => {
    const result = deriveAtlasStats({ ...RAW, edition: { version: "1.30.0" } });
    expect(result.stack).toBe(
      "Next.js 16 · React 19 · TypeScript · MapLibre GL · Neon Postgres · Drizzle · Vercel",
    );
    expect(result.license).toBe("MIT + CC BY 4.0");
  });
});

const VALID = { ...RAW, states: 55, stateCodes: [...FIFTY, "DC", "GU", "MP", "PR", "VI"] };

describe("isValidRaw", () => {
  it("accepts a well-formed object, with or without stateCodes", () => {
    expect(isValidRaw(VALID)).toBe(true);
    expect(isValidRaw(RAW)).toBe(true);
  });

  it("accepts the static FALLBACK", () => {
    expect(isValidRaw(FALLBACK)).toBe(true);
  });

  it.each([
    ["null", null],
    ["array", []],
    ["states null", { ...VALID, states: null }],
    ["states undefined", { ...VALID, states: undefined }],
    ["states string", { ...VALID, states: "55" }],
    ["states fractional", { ...VALID, states: 54.5 }],
    ["count zero", { ...VALID, count: 0 }],
    ["negative operationalMw", { ...VALID, operationalMw: -1 }],
    ["non-finite plannedMw", { ...VALID, plannedMw: Infinity }],
    ["string underConstructionMw", { ...VALID, underConstructionMw: "1" }],
    ["stateCodes non-array", { ...VALID, stateCodes: "AL" }],
    ["lowercase code", { ...VALID, stateCodes: ["al"] }],
    ["3-letter code", { ...VALID, stateCodes: ["USA"] }],
    ["non-string code", { ...VALID, stateCodes: [12] }],
    ["unknown code", { ...VALID, stateCodes: [...VALID.stateCodes.slice(1), "ZZ"] }],
    ["duplicate code", { ...VALID, stateCodes: VALID.stateCodes.map((c, i) => (i === 1 ? VALID.stateCodes[0] : c)) }],
    ["length mismatch", { ...VALID, stateCodes: VALID.stateCodes.slice(1) }],
  ])("rejects %s", (_label, raw) => {
    expect(isValidRaw(raw)).toBe(false);
  });
});

describe("selectSource", () => {
  const base = { ...VALID, count: 2000 };
  const fb = { ...VALID, count: 1 };

  it("prefers a valid canonical", () => {
    expect(selectSource(VALID, base, fb)).toEqual({ source: "canonical", raw: VALID });
  });

  it("falls to base when canonical is invalid", () => {
    expect(selectSource({ ...VALID, states: null }, base, fb)).toEqual({ source: "base", raw: base });
  });

  it("falls to fallback when canonical and base are invalid", () => {
    expect(selectSource(null, {}, fb)).toEqual({ source: "fallback", raw: fb });
  });

  it.each([
    ["unknown code", { ...VALID, stateCodes: [...VALID.stateCodes.slice(1), "ZZ"] }],
    ["duplicate code", { ...VALID, stateCodes: VALID.stateCodes.map((c, i) => (i === 1 ? VALID.stateCodes[0] : c)) }],
    ["length mismatch", { ...VALID, stateCodes: VALID.stateCodes.slice(1) }],
  ])("falls to base for canonical with %s", (_label, canonical) => {
    expect(selectSource(canonical, base, fb)).toEqual({ source: "base", raw: base });
  });

  it("never renders null when canonical has null states", () => {
    const { raw } = selectSource({ ...VALID, states: null }, base, fb);
    const derived = deriveAtlasStats(raw);
    expect(derived.coverage).not.toMatch(/null|undefined/);
    expect(derived.coverage).toBe("50 states, DC and 4 territories");
  });
});

describe("deriveAtlasStats unrecognised codes", () => {
  it("takes the conservative path when no code is recognised", () => {
    const result = deriveAtlasStats({ ...RAW, states: 2, stateCodes: ["ZZ", "QQ"] });
    expect(result.states).toBeNull();
    expect(result.coverage).toBe("2 U.S. jurisdictions");
  });
});
