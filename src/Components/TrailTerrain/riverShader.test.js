/**
 * riverShader.test.js
 *
 * Behavioral tests for injectRiverShader (pure onBeforeCompile injector)
 * and the RIVER constants added/changed in Unit 5.
 *
 * Runs in vitest node env — no jsdom, no WebGL context required.
 * three.js Color is a pure JS class — works fine in Node.
 *
 * Stub pattern: minimal { vertexShader, fragmentShader, uniforms } object
 * matching what THREE.js passes to onBeforeCompile for MeshStandardMaterial.
 * The fragment stub includes #include <opaque_fragment> so replace() targets it.
 *
 * Covers:
 *  - Uniform contract: all 8 uniforms present with correct JS types
 *  - uTime initial value is 0
 *  - uGlintColor is a THREE.Color
 *  - Fragment: ekBandA and ekBandB present (band computations)
 *  - Fragment: #include <opaque_fragment> preserved (prepend pattern)
 *  - Fragment: outgoingLight += before opaque_fragment (HDR addition order)
 *  - Fragment: all 8 uniform declarations present
 *  - RIVER constants: SCROLL_SPEED is undefined (dead constant removed)
 *  - RIVER constants: all 7 new GLINT keys present
 *  - GLINT_COLOR valid hex, GLINT_INTENSITY > 1.0, co-prime frequencies
 */

import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { injectRiverShader } from "./River";
import { RIVER } from "./constants";

// ---------------------------------------------------------------------------
// Stub factory — fresh object per test to prevent cross-test mutation
// ---------------------------------------------------------------------------
function makeStub() {
  return {
    vertexShader: "void main() { gl_Position = vec4(0.0); }",
    fragmentShader: [
      "void main() {",
      "  vec3 outgoingLight = vec3(0.0);",
      "  #include <opaque_fragment>",
      "}",
    ].join("\n"),
    uniforms: {},
  };
}

// ---------------------------------------------------------------------------
// Suite 1 — Uniform contract
// ---------------------------------------------------------------------------
describe("injectRiverShader — uniform contract", () => {
  it("adds all 8 required uniforms to shader.uniforms", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    const expectedKeys = [
      "uTime",
      "uGlintColor",
      "uGlintIntensity",
      "uGlintSharpness",
      "uGlintFreqA",
      "uGlintFreqB",
      "uGlintSpeedA",
      "uGlintSpeedB",
    ];
    for (const key of expectedKeys) {
      expect(stub.uniforms).toHaveProperty(key);
      expect(stub.uniforms[key]).toHaveProperty("value");
    }
  });

  it("uTime.value starts at 0", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.uniforms.uTime.value).toBe(0);
  });

  it("uGlintColor.value is a THREE.Color instance", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.uniforms.uGlintColor.value).toBeInstanceOf(THREE.Color);
  });

  it("uGlintColor matches RIVER.GLINT_COLOR", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    const expected = new THREE.Color(RIVER.GLINT_COLOR);
    const actual = stub.uniforms.uGlintColor.value;
    expect(actual.r).toBeCloseTo(expected.r, 5);
    expect(actual.g).toBeCloseTo(expected.g, 5);
    expect(actual.b).toBeCloseTo(expected.b, 5);
  });

  it("all scalar uniforms have numeric values", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    const scalars = [
      "uGlintIntensity",
      "uGlintSharpness",
      "uGlintFreqA",
      "uGlintFreqB",
      "uGlintSpeedA",
      "uGlintSpeedB",
    ];
    for (const key of scalars) {
      expect(typeof stub.uniforms[key].value).toBe("number");
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Fragment shader mutations
// ---------------------------------------------------------------------------
describe("injectRiverShader — fragment shader", () => {
  it("fragment contains ekBandA (band A sine computation)", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.fragmentShader).toContain("ekBandA");
  });

  it("fragment contains ekBandB (band B sine computation)", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.fragmentShader).toContain("ekBandB");
  });

  it("fragment still contains #include <opaque_fragment> (prepend pattern — not removed)", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.fragmentShader).toContain("#include <opaque_fragment>");
  });

  it("outgoingLight += uGlintColor appears before #include <opaque_fragment>", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    const lightIdx = stub.fragmentShader.indexOf("outgoingLight += uGlintColor");
    const opaqueIdx = stub.fragmentShader.indexOf("#include <opaque_fragment>");
    expect(lightIdx).toBeGreaterThan(-1);
    expect(opaqueIdx).toBeGreaterThan(lightIdx);
  });

  it("fragment uses 6.28318 (2π) in the sin argument", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.fragmentShader).toContain("6.28318");
  });

  it("ekGlint normalizes band sum by * 0.5 so peak == uGlintIntensity exactly", () => {
    // HDR contract: peak = uGlintIntensity (~2.6). Without normalization,
    // simultaneous band peaks reach 2×2.6 = 5.2× — 2× hotter than designed.
    // This assertion locks the normalization against accidental regression.
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.fragmentShader).toContain("(ekBandA + ekBandB) * 0.5");
  });

  it("fragment declares all 8 custom uniforms", () => {
    const stub = makeStub();
    injectRiverShader(stub);
    expect(stub.fragmentShader).toContain("uniform float uTime");
    expect(stub.fragmentShader).toContain("uniform vec3  uGlintColor");
    expect(stub.fragmentShader).toContain("uniform float uGlintIntensity");
    expect(stub.fragmentShader).toContain("uniform float uGlintSharpness");
    expect(stub.fragmentShader).toContain("uniform float uGlintFreqA");
    expect(stub.fragmentShader).toContain("uniform float uGlintFreqB");
    expect(stub.fragmentShader).toContain("uniform float uGlintSpeedA");
    expect(stub.fragmentShader).toContain("uniform float uGlintSpeedB");
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — RIVER constants contract (Unit 5)
// ---------------------------------------------------------------------------
describe("RIVER constants — Unit 5 contract", () => {
  it("RIVER.SCROLL_SPEED is undefined (dead constant removed)", () => {
    expect(RIVER.SCROLL_SPEED).toBeUndefined();
  });

  it("exports all 7 GLINT constants", () => {
    const glintKeys = [
      "GLINT_FREQ_A",
      "GLINT_FREQ_B",
      "GLINT_SPEED_A",
      "GLINT_SPEED_B",
      "GLINT_SHARPNESS",
      "GLINT_INTENSITY",
      "GLINT_COLOR",
    ];
    for (const key of glintKeys) {
      expect(RIVER).toHaveProperty(key);
    }
  });

  it("GLINT_COLOR is a valid 6-digit hex string", () => {
    expect(RIVER.GLINT_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("GLINT_INTENSITY > 1.0 (HDR bloom trigger — must cross luminanceThreshold=1.0)", () => {
    expect(RIVER.GLINT_INTENSITY).toBeGreaterThan(1.0);
  });

  it("GLINT_SHARPNESS is a positive number", () => {
    expect(typeof RIVER.GLINT_SHARPNESS).toBe("number");
    expect(RIVER.GLINT_SHARPNESS).toBeGreaterThan(0);
  });

  it("GLINT_FREQ_A and GLINT_FREQ_B are co-prime (no harmonic sync)", () => {
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    expect(gcd(RIVER.GLINT_FREQ_A, RIVER.GLINT_FREQ_B)).toBe(1);
  });

  it("GLINT_SPEED_A and GLINT_SPEED_B have opposite signs (upstream + downstream shimmer)", () => {
    expect(Math.sign(RIVER.GLINT_SPEED_A)).toBe(1);
    expect(Math.sign(RIVER.GLINT_SPEED_B)).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Second-call safety
// ---------------------------------------------------------------------------
describe("injectRiverShader — second-call safety", () => {
  it("does not throw when called a second time on the same stub", () => {
    const stub = makeStub();
    expect(() => {
      injectRiverShader(stub);
      injectRiverShader(stub);
    }).not.toThrow();
  });
});
