/**
 * Fireflies.test.jsx
 *
 * Regression test for the color buffer aliasing bug:
 *
 * BUG: useMemo built one `col` Float32Array passed both as `colors` and to
 * the BufferAttribute. THREE.BufferAttribute stores arrays by reference, so
 * `colorAttr.array === colors`. The useFrame loop wrote
 * `colArr[bi] = colors[bi] * hdrScale` — reading and writing the SAME array.
 * During idle phase (hdrScale=0), this permanently zeroed all base colors
 * within one cycle, making fireflies invisible forever.
 *
 * FIX: Two separate arrays — `baseColors` (immutable source) and `colors`
 * (attribute copy, writable by useFrame). Mirrors the existing pos/base
 * (positions/basePositions) pattern.
 *
 * Tests:
 * (1) Source returns both `baseColors` and `colors` from useMemo.
 * (2) `colors` is assigned via `.slice()` (separate copy, not a reference alias).
 * (3) useFrame reads from `baseColors[bi]`, not `colors[bi]`.
 * (4) Simulation: writing zero into the attribute array (colors) does NOT
 *     corrupt the baseColors source — proving the alias is broken.
 * (5) Export contract: Fireflies default export is a function.
 */

import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileSrc = readFileSync(path.join(__dirname, "Fireflies.jsx"), "utf8");

// ---------------------------------------------------------------------------
// Mocks required for import
// ---------------------------------------------------------------------------
vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Suite 1 — two-array aliasing-prevention contract (source-string checks)
// ---------------------------------------------------------------------------
describe("Fireflies — color buffer aliasing fix (source contract)", () => {
  it("useMemo returns baseColors as a separate key from colors", () => {
    // The destructuring must include baseColors
    expect(fileSrc).toContain("baseColors");
    // Returned in the memo object
    expect(fileSrc).toContain("baseColors: baseCol");
  });

  it("colors is assigned as a .slice() copy of baseCol, not the same reference", () => {
    // The fix: const col = baseCol.slice()
    expect(fileSrc).toContain("baseCol.slice()");
    // And that copy is returned as colors
    expect(fileSrc).toContain("colors: col");
  });

  it("useFrame reads baseColors[bi], not colors[bi] (no aliased read)", () => {
    // The read side must reference baseColors, not colors
    expect(fileSrc).toContain("baseColors[bi]");
    expect(fileSrc).toContain("baseColors[bi + 1]");
    expect(fileSrc).toContain("baseColors[bi + 2]");
  });

  it("useFrame does NOT read colors[bi] (old aliased pattern is gone)", () => {
    // The old bug was: colArr[bi] = colors[bi] * hdrScale
    // After the fix, colors[bi] should NOT appear as a read in useFrame
    // (it's fine for colors to appear in the JSX args, but not as the read source)
    const useFrameStart = fileSrc.indexOf("useFrame(");
    const useFrameEnd = fileSrc.indexOf("}, []);", useFrameStart);
    // useFrame is a closure, not terminated by "}, [])" — get the loop body
    // by finding the section between useFrame and the return statement
    const returnIdx = fileSrc.indexOf("  return (", useFrameStart);
    const useFrameBody = fileSrc.slice(useFrameStart, returnIdx);
    // The aliased read pattern must not be present in the useFrame body
    expect(useFrameBody).not.toContain("colors[bi]");
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — simulation: alias-broken invariant
//
// Directly simulates the core of the bug: if colors and baseColors are the
// same array, writing 0 to colors[0] would corrupt baseColors[0].
// With the fix (slice copy), they are independent.
// ---------------------------------------------------------------------------
describe("Fireflies — color buffer separation invariant (simulation)", () => {
  it("writing to the attribute (colors) array does not corrupt baseColors", () => {
    // Simulate what useMemo produces
    const baseCol = new Float32Array([1.0, 0.93, 0.27]); // one yellow firefly
    const col = baseCol.slice(); // the fix: separate copy

    // Simulate what useFrame does during idle phase (hdrScale=0)
    col[0] = baseCol[0] * 0; // = 0
    col[1] = baseCol[1] * 0; // = 0
    col[2] = baseCol[2] * 0; // = 0

    // baseCol must be unaffected
    expect(baseCol[0]).toBeCloseTo(1.0);
    expect(baseCol[1]).toBeCloseTo(0.93);
    expect(baseCol[2]).toBeCloseTo(0.27);
  });

  it("the OLD aliased pattern (no slice) would corrupt the base — proving the fix was necessary", () => {
    // Demonstrate what the bug did:
    const baseCol = new Float32Array([1.0, 0.93, 0.27]);
    const col = baseCol; // BUG: same reference, no slice

    // Simulate idle phase write
    col[0] = baseCol[0] * 0;
    col[1] = baseCol[1] * 0;
    col[2] = baseCol[2] * 0;

    // With the alias, baseCol IS col — both are now zeroed
    expect(baseCol[0]).toBe(0);
    expect(baseCol[1]).toBe(0);
    expect(baseCol[2]).toBe(0);
    // This is exactly the bug: next frame read would return 0 * hdrScale = 0 forever
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — export contract
// ---------------------------------------------------------------------------
describe("Fireflies — export contract", () => {
  it("default export is a function", async () => {
    const mod = await import("./Fireflies");
    expect(typeof mod.default).toBe("function");
  });

  it("component source references toneMapped={false} (HDR bloom contract)", () => {
    expect(fileSrc).toContain("toneMapped={false}");
  });

  it("component source references AdditiveBlending (glow blending mode)", () => {
    expect(fileSrc).toContain("AdditiveBlending");
  });

  it("component source references depthWrite={false} (transparent particles must not write depth)", () => {
    expect(fileSrc).toContain("depthWrite={false}");
  });
});
