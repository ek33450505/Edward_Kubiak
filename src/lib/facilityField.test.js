import { describe, it, expect } from "vitest";
import {
  mulberry32,
  fitContain,
  easeOutCubic,
  particleProgress,
  pulseAlpha,
  INTRO_MS,
  PULSE_END_MS,
  PULSE_MIN,
  isValidPoints,
  STATUS_STYLE,
  statusLabel,
} from "./facilityField";
import { STATUS_COLORS } from "./tokens";

const good = () => ({ w: 100, h: 50, count: 2, statuses: ["operational", "under_construction"], pts: [1, 2, 0, 3, 4, 1] });

describe("mulberry32", () => {
  it("is deterministic per seed and stays in [0,1)", () => {
    const a = mulberry32(2724);
    const b = mulberry32(2724);
    for (let i = 0; i < 50; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("differs across seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("fitContain", () => {
  it("letterboxes a wide box in a tall container", () => {
    expect(fitContain(200, 100, 100, 100)).toEqual({ scale: 0.5, ox: 0, oy: 25 });
  });
  it("pillarboxes a tall box in a wide container", () => {
    expect(fitContain(100, 200, 200, 100)).toEqual({ scale: 0.5, ox: 75, oy: 0 });
  });
});

describe("easeOutCubic", () => {
  it("hits the endpoints and is monotonic", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("particleProgress", () => {
  it("is 0 before the delay and 1 after delay + duration", () => {
    expect(particleProgress(0, 50, 100)).toBe(0);
    expect(particleProgress(450, 50, 100)).toBe(0);
    expect(particleProgress(2500, 100, 100)).toBe(1);
    expect(particleProgress(9999, 0, 100)).toBe(1);
  });
  it("starts western points before eastern ones", () => {
    expect(particleProgress(500, 0, 100)).toBeGreaterThan(particleProgress(500, 100, 100));
  });
  it("honours custom timing", () => {
    expect(particleProgress(100, 0, 100, 100, 0)).toBe(1);
  });
});

describe("timeline", () => {
  it("ends inside the WCAG 2.2.2 five-second allowance, after the intro", () => {
    expect(INTRO_MS).toBe(2500);
    expect(PULSE_END_MS).toBeGreaterThan(INTRO_MS);
    expect(PULSE_END_MS).toBeLessThanOrEqual(4500);
  });
});

describe("pulseAlpha", () => {
  it("stays within [PULSE_MIN, 1]", () => {
    for (let t = INTRO_MS; t <= PULSE_END_MS; t += 37) {
      for (const phase of [0, 1.7, 4.2]) {
        const a = pulseAlpha(t, phase);
        expect(a).toBeGreaterThanOrEqual(PULSE_MIN - 1e-9);
        expect(a).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });
  it("is exactly 1 at both ends of the pulse window so nothing pops", () => {
    for (const phase of [0, 2, 5]) {
      expect(pulseAlpha(INTRO_MS, phase)).toBe(1);
      expect(pulseAlpha(PULSE_END_MS, phase)).toBe(1);
    }
  });
  it("dips mid-window", () => {
    const mid = (INTRO_MS + PULSE_END_MS) / 2;
    const min = Math.min(...[0, 1, 2, 3, 4, 5, 6].map((ph) => pulseAlpha(mid, ph)));
    expect(min).toBeLessThan(0.7);
  });
});

describe("isValidPoints", () => {
  it("accepts a well-formed payload", () => {
    expect(isValidPoints(good())).toBe(true);
  });
  it.each([
    ["null", null],
    ["non-positive w", { ...good(), w: 0 }],
    ["non-numeric h", { ...good(), h: "50" }],
    ["statuses not an array", { ...good(), statuses: "ab" }],
    ["pts length not multiple of 3", { ...good(), pts: [1, 2, 0, 3] }],
    ["count mismatch", { ...good(), count: 3 }],
    ["non-integer coordinate", { ...good(), pts: [1.5, 2, 0, 3, 4, 1] }],
    ["status index out of range", { ...good(), pts: [1, 2, 0, 3, 4, 2] }],
    ["negative status index", { ...good(), pts: [1, 2, -1, 3, 4, 1] }],
    ["unknown status name", { ...good(), statuses: ["a", "b"] }],
    ["prototype-key status name", { ...good(), statuses: ["operational", "toString"] }],
  ])("rejects %s", (_name, p) => {
    expect(isValidPoints(p)).toBe(false);
  });
});

describe("STATUS_STYLE / statusLabel", () => {
  it("maps under_construction to the construction token and takes colours from tokens", () => {
    expect(STATUS_STYLE.under_construction.color).toBe(STATUS_COLORS.construction);
    expect(STATUS_STYLE.operational.color).toBe(STATUS_COLORS.operational);
  });
  it("draws cancelled at reduced alpha only", () => {
    expect(STATUS_STYLE.cancelled.alpha).toBeCloseTo(0.55);
    expect(STATUS_STYLE.proposed.alpha).toBe(1);
  });
  it("labels every status", () => {
    expect(["operational", "under_construction", "permitted", "proposed", "cancelled"].map(statusLabel)).toEqual([
      "Operational",
      "Under construction",
      "Permitted",
      "Proposed",
      "Cancelled",
    ]);
  });
});
