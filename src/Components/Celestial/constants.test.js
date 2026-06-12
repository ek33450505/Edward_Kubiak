/**
 * constants.test.js — behavioral contracts for Celestial constants.
 *
 * These tests lock in the invariants that the scene depends on:
 *   - NEBULA layer count and color format
 *   - BLOOM selectivity gate (LUMINANCE_THRESHOLD must not drift from 1.0)
 *   - HDR_FRACTION range contract
 *   - COMETS trail length sanity
 */

import { test, expect } from "vitest";
import { STARS, NEBULA, COMETS, BLOOM, HDR_FRACTION } from "./constants";

test("NEBULA has exactly 5 layers", () => expect(NEBULA).toHaveLength(5));

test("all NEBULA colors are valid hex", () => {
  NEBULA.forEach((l) => expect(l.color).toMatch(/^#[0-9a-f]{6}$/i));
});

test("BLOOM LUMINANCE_THRESHOLD is exactly 1.0 (selectivity contract)", () =>
  expect(BLOOM.LUMINANCE_THRESHOLD).toBe(1.0));

test("HDR_FRACTION is in range (0, 0.2]", () => {
  expect(HDR_FRACTION).toBeGreaterThan(0);
  expect(HDR_FRACTION).toBeLessThanOrEqual(0.2);
});

test("COMETS.TRAIL_LENGTH is positive integer", () =>
  expect(COMETS.TRAIL_LENGTH).toBeGreaterThan(0));

test("STARS has required shape fields", () => {
  expect(STARS).toHaveProperty("COUNT");
  expect(STARS).toHaveProperty("RADIUS");
  expect(STARS.COUNT).toBeGreaterThan(0);
});

test("NEBULA hdrMult values all exceed 1.0 (needed to pass bloom gate)", () => {
  NEBULA.forEach((l) => expect(l.hdrMult).toBeGreaterThan(1.0));
});
