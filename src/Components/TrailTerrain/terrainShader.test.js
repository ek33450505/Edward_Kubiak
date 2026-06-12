/**
 * terrainShader.test.js
 *
 * Behavioral tests for injectTerrainShader (pure onBeforeCompile injector)
 * and the new TERRAIN constants added in Unit 3.
 *
 * Runs in vitest node env — no jsdom, no WebGL context required.
 * three.js Color and Vector3 are pure JS classes and work fine in Node.
 *
 * Stub pattern: a minimal { vertexShader, fragmentShader, uniforms } object
 * containing the Three.js include markers that injectTerrainShader targets.
 *
 * Covers:
 *  - Uniform contract: all 10 uniforms present with correct JS types
 *  - Vertex shader: vEkWorldY varying declared and assigned
 *  - Fragment shader: fog_fragment replaced (not present as raw include)
 *  - Fragment shader: opaque_fragment PRESERVED (prepend pattern — not removed)
 *  - TERRAIN constants: new keys present, hex colors valid, Y_MIN < Y_MAX
 *  - No-throw on second call (single-call contract documented but defensively tested)
 */

import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { injectTerrainShader } from "./Terrain.jsx";
import { TERRAIN } from "./constants.js";

// ---------------------------------------------------------------------------
// Stub factory — fresh object per test to prevent cross-test mutation
// ---------------------------------------------------------------------------
function makeStub() {
  return {
    vertexShader: [
      "void main() {",
      "  #include <common>",
      "  #include <begin_vertex>",
      "  #include <fog_vertex>",
      "  gl_Position = vec4(transformed, 1.0);",
      "}",
    ].join("\n"),
    fragmentShader: [
      "void main() {",
      "  #include <normal_fragment_begin>",
      "  #include <lights_lambert_fragment>",
      "  #include <opaque_fragment>",
      "  #include <tonemapping_fragment>",
      "  #include <fog_fragment>",
      "}",
    ].join("\n"),
    uniforms: {},
  };
}

// ---------------------------------------------------------------------------
// Suite 1 — Uniform contract
// ---------------------------------------------------------------------------
describe("injectTerrainShader — uniform contract", () => {
  it("adds all 10 required uniforms to shader.uniforms", () => {
    const stub = makeStub();
    injectTerrainShader(stub);

    const expectedKeys = [
      "uRimColor",
      "uRimStrength",
      "uRimPower",
      "uSunDirWorld",
      "uAerialDensity",
      "uAerialStrength",
      "uAerialYMin",
      "uAerialYMax",
      "uAerialLow",
      "uAerialHigh",
    ];
    for (const key of expectedKeys) {
      expect(stub.uniforms).toHaveProperty(key);
      expect(stub.uniforms[key]).toHaveProperty("value");
    }
  });

  it("uRimColor.value is a THREE.Color", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.uniforms.uRimColor.value).toBeInstanceOf(THREE.Color);
  });

  it("uAerialLow.value is a THREE.Color", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.uniforms.uAerialLow.value).toBeInstanceOf(THREE.Color);
  });

  it("uAerialHigh.value is a THREE.Color", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.uniforms.uAerialHigh.value).toBeInstanceOf(THREE.Color);
  });

  it("uSunDirWorld.value is a normalized THREE.Vector3", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    const v = stub.uniforms.uSunDirWorld.value;
    expect(v).toBeInstanceOf(THREE.Vector3);
    // Normalized: length should be ~1.0
    const len = v.length();
    expect(len).toBeGreaterThan(0.999);
    expect(len).toBeLessThan(1.001);
  });

  it("scalar uniforms have numeric values", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    const scalarKeys = [
      "uRimStrength",
      "uRimPower",
      "uAerialDensity",
      "uAerialStrength",
      "uAerialYMin",
      "uAerialYMax",
    ];
    for (const key of scalarKeys) {
      expect(typeof stub.uniforms[key].value).toBe("number");
    }
  });

  it("uRimColor matches TERRAIN.RIM_COLOR hex", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    const expected = new THREE.Color(TERRAIN.RIM_COLOR);
    const actual = stub.uniforms.uRimColor.value;
    expect(actual.r).toBeCloseTo(expected.r, 5);
    expect(actual.g).toBeCloseTo(expected.g, 5);
    expect(actual.b).toBeCloseTo(expected.b, 5);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Vertex shader mutations
// ---------------------------------------------------------------------------
describe("injectTerrainShader — vertex shader", () => {
  it("declares the vEkWorldY varying in the vertex shader", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.vertexShader).toContain("varying float vEkWorldY");
  });

  it("assigns vEkWorldY from modelMatrix * transformed", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.vertexShader).toContain("vEkWorldY");
    expect(stub.vertexShader).toContain("modelMatrix");
    expect(stub.vertexShader).toContain("transformed");
  });

  it("assignment appears after #include <fog_vertex> (not before)", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    const fogIdx = stub.vertexShader.indexOf("#include <fog_vertex>");
    const assignIdx = stub.vertexShader.indexOf("vEkWorldY = ");
    expect(fogIdx).toBeGreaterThan(-1);
    expect(assignIdx).toBeGreaterThan(fogIdx);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Fragment shader mutations
// ---------------------------------------------------------------------------
describe("injectTerrainShader — fragment shader", () => {
  it("declares the vEkWorldY varying in the fragment shader", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.fragmentShader).toContain("varying float vEkWorldY");
  });

  it("no longer contains raw #include <fog_fragment> (replaced by aerial perspective)", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.fragmentShader).not.toContain("#include <fog_fragment>");
  });

  it("still contains #include <opaque_fragment> (prepend pattern — not removed)", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.fragmentShader).toContain("#include <opaque_fragment>");
  });

  it("rim light code is injected BEFORE #include <opaque_fragment>", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    const rimIdx = stub.fragmentShader.indexOf("outgoingLight +=");
    const opaqueIdx = stub.fragmentShader.indexOf("#include <opaque_fragment>");
    expect(rimIdx).toBeGreaterThan(-1);
    expect(opaqueIdx).toBeGreaterThan(rimIdx);
  });

  it("contains aerial perspective fog factor formula", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    // exp2 fog formula with log2(e) constant
    expect(stub.fragmentShader).toContain("ekFogFactor");
    expect(stub.fragmentShader).toContain("1.442695");
  });

  it("contains aerial color mix using vEkWorldY", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.fragmentShader).toContain("ekAerial");
    expect(stub.fragmentShader).toContain("vEkWorldY");
    expect(stub.fragmentShader).toContain("smoothstep");
  });

  it("fragment shader declares all custom uniforms", () => {
    const stub = makeStub();
    injectTerrainShader(stub);
    expect(stub.fragmentShader).toContain("uniform vec3  uRimColor");
    expect(stub.fragmentShader).toContain("uniform float uRimStrength");
    expect(stub.fragmentShader).toContain("uniform float uRimPower");
    expect(stub.fragmentShader).toContain("uniform vec3  uSunDirWorld");
    expect(stub.fragmentShader).toContain("uniform float uAerialDensity");
    expect(stub.fragmentShader).toContain("uniform float uAerialStrength");
    expect(stub.fragmentShader).toContain("uniform float uAerialYMin");
    expect(stub.fragmentShader).toContain("uniform float uAerialYMax");
    expect(stub.fragmentShader).toContain("uniform vec3  uAerialLow");
    expect(stub.fragmentShader).toContain("uniform vec3  uAerialHigh");
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Second-call safety
// Single-call contract: Three.js program cache prevents double-invocation in
// normal use. This test verifies the function does not throw if called again.
// ---------------------------------------------------------------------------
describe("injectTerrainShader — second-call safety", () => {
  it("does not throw when called a second time on the same stub", () => {
    const stub = makeStub();
    expect(() => {
      injectTerrainShader(stub);
      injectTerrainShader(stub);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — TERRAIN constants contract (Unit 3 additions)
// ---------------------------------------------------------------------------
describe("TERRAIN constants — Unit 3 additions", () => {
  const hexRe = /^#[0-9a-fA-F]{6}$/;

  it("exports RIM_COLOR as a valid 6-digit hex string", () => {
    expect(TERRAIN.RIM_COLOR).toMatch(hexRe);
  });

  it("exports AERIAL_COLOR_LOW as a valid 6-digit hex string", () => {
    expect(TERRAIN.AERIAL_COLOR_LOW).toMatch(hexRe);
  });

  it("exports AERIAL_COLOR_HIGH as a valid 6-digit hex string", () => {
    expect(TERRAIN.AERIAL_COLOR_HIGH).toMatch(hexRe);
  });

  it("exports RIM_STRENGTH as a positive number", () => {
    expect(typeof TERRAIN.RIM_STRENGTH).toBe("number");
    expect(TERRAIN.RIM_STRENGTH).toBeGreaterThan(0);
  });

  it("exports RIM_POWER as a positive number", () => {
    expect(typeof TERRAIN.RIM_POWER).toBe("number");
    expect(TERRAIN.RIM_POWER).toBeGreaterThan(0);
  });

  it("exports AERIAL_DENSITY as a positive number", () => {
    expect(typeof TERRAIN.AERIAL_DENSITY).toBe("number");
    expect(TERRAIN.AERIAL_DENSITY).toBeGreaterThan(0);
  });

  it("exports AERIAL_STRENGTH as a positive number", () => {
    expect(typeof TERRAIN.AERIAL_STRENGTH).toBe("number");
    expect(TERRAIN.AERIAL_STRENGTH).toBeGreaterThan(0);
  });

  it("AERIAL_Y_MIN < AERIAL_Y_MAX (valid smoothstep range)", () => {
    expect(TERRAIN.AERIAL_Y_MIN).toBeLessThan(TERRAIN.AERIAL_Y_MAX);
  });

  it("exports all 9 new TERRAIN keys", () => {
    const newKeys = [
      "RIM_COLOR",
      "RIM_STRENGTH",
      "RIM_POWER",
      "AERIAL_DENSITY",
      "AERIAL_STRENGTH",
      "AERIAL_Y_MIN",
      "AERIAL_Y_MAX",
      "AERIAL_COLOR_LOW",
      "AERIAL_COLOR_HIGH",
    ];
    for (const key of newKeys) {
      expect(TERRAIN).toHaveProperty(key);
    }
  });
});
