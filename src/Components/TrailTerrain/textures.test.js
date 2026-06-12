/**
 * textures.test.js
 *
 * Behavioral tests for the deterministic DataTexture generators in textures.js.
 * Runs in vitest node env — no jsdom, no DOM, no WebGL context required.
 * three.js DataTexture is a pure JS class and works fine in Node.
 *
 * Covers:
 *  - Determinism: same arguments → identical pixel arrays
 *  - Seed sensitivity: different seeds produce different output
 *  - Data length: always size*size*4 bytes
 *  - Radial glow geometry: center alpha > corner alpha; corner alpha === 0
 *  - Noise wrapping: wrapS and wrapT === THREE.RepeatWrapping
 */

import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { createRadialGlowTexture, createNoiseTexture } from "./textures.js";

// ---------------------------------------------------------------------------
// createRadialGlowTexture
// ---------------------------------------------------------------------------

describe("createRadialGlowTexture", () => {
  it("data length equals size*size*4", () => {
    const size = 32;
    const tex = createRadialGlowTexture(size, 2);
    expect(tex.image.data.length).toBe(size * size * 4);
  });

  it("center alpha is greater than corner alpha", () => {
    const size = 64;
    const tex = createRadialGlowTexture(size, 2);
    const data = tex.image.data;

    // The most-central pixel in a 64×64 grid is at (31, 31) or (32, 32).
    // Both are close to centre; pick (31, 31) as it is the integer floor of 31.5.
    const centerPx = 31;
    const centerPy = 31;
    const centerIdx = (centerPy * size + centerPx) * 4;
    const centerAlpha = data[centerIdx + 3];

    // Corner pixel (0, 0)
    const cornerAlpha = data[3]; // pixel 0 → index 3 is alpha channel

    expect(centerAlpha).toBeGreaterThan(cornerAlpha);
  });

  it("corner alpha is 0 (pixels outside inscribed circle receive alpha 0)", () => {
    const size = 64;
    const tex = createRadialGlowTexture(size, 2);
    const data = tex.image.data;

    // All four corners should have alpha 0 — they are at distance sqrt(2)*halfSize ≈ 45.25
    // from the centre, well beyond halfSize = 32.
    const corners = [
      0,                                                        // (0, 0)
      (size - 1) * 4,                                          // (size-1, 0)
      ((size - 1) * size) * 4,                                 // (0, size-1)
      ((size - 1) * size + (size - 1)) * 4,                    // (size-1, size-1)
    ];

    for (const baseIdx of corners) {
      expect(data[baseIdx + 3]).toBe(0);
    }
  });

  it("rgb channels are always 255 (colour driven by material, not texture)", () => {
    const size = 16;
    const tex = createRadialGlowTexture(size, 2);
    const data = tex.image.data;

    for (let i = 0; i < data.length; i += 4) {
      expect(data[i]).toBe(255);     // r
      expect(data[i + 1]).toBe(255); // g
      expect(data[i + 2]).toBe(255); // b
    }
  });

  it("uses ClampToEdgeWrapping (no tiling)", () => {
    const tex = createRadialGlowTexture(32, 2);
    expect(tex.wrapS).toBe(THREE.ClampToEdgeWrapping);
    expect(tex.wrapT).toBe(THREE.ClampToEdgeWrapping);
  });

  it("uses LinearFilter for min and mag", () => {
    const tex = createRadialGlowTexture(32, 2);
    expect(tex.minFilter).toBe(THREE.LinearFilter);
    expect(tex.magFilter).toBe(THREE.LinearFilter);
  });
});

// ---------------------------------------------------------------------------
// createNoiseTexture
// ---------------------------------------------------------------------------

describe("createNoiseTexture", () => {
  it("data length equals size*size*4", () => {
    const size = 64;
    const tex = createNoiseTexture(size, 42, 4, 3);
    expect(tex.image.data.length).toBe(size * size * 4);
  });

  it("same seed produces identical image.data arrays (determinism)", () => {
    const tex1 = createNoiseTexture(64, 99, 4, 3);
    const tex2 = createNoiseTexture(64, 99, 4, 3);
    expect(Array.from(tex1.image.data)).toEqual(Array.from(tex2.image.data));
  });

  it("different seeds produce different image.data arrays (seed sensitivity)", () => {
    const tex1 = createNoiseTexture(64, 1, 4, 3);
    const tex2 = createNoiseTexture(64, 2, 4, 3);
    // Not guaranteed pixel-by-pixel — check that at least some bytes differ
    let hasDifference = false;
    for (let i = 0; i < tex1.image.data.length; i++) {
      if (tex1.image.data[i] !== tex2.image.data[i]) {
        hasDifference = true;
        break;
      }
    }
    expect(hasDifference).toBe(true);
  });

  it("wrapS and wrapT are RepeatWrapping (tiling contract)", () => {
    const tex = createNoiseTexture(64, 42, 4, 3);
    expect(tex.wrapS).toBe(THREE.RepeatWrapping);
    expect(tex.wrapT).toBe(THREE.RepeatWrapping);
  });

  it("uses LinearFilter for min and mag", () => {
    const tex = createNoiseTexture(64, 42, 4, 3);
    expect(tex.minFilter).toBe(THREE.LinearFilter);
    expect(tex.magFilter).toBe(THREE.LinearFilter);
  });

  it("rgb channels are always 255", () => {
    const size = 32;
    const tex = createNoiseTexture(size, 7, 4, 2);
    const data = tex.image.data;

    for (let i = 0; i < data.length; i += 4) {
      expect(data[i]).toBe(255);     // r
      expect(data[i + 1]).toBe(255); // g
      expect(data[i + 2]).toBe(255); // b
    }
  });

  it("alpha values vary across the texture (noise is non-uniform)", () => {
    const size = 32;
    const tex = createNoiseTexture(size, 123, 4, 3);
    const data = tex.image.data;

    const alphas = new Set();
    for (let i = 3; i < data.length; i += 4) {
      alphas.add(data[i]);
    }
    // A 32×32 noise texture with 3 octaves should produce more than 10 distinct alpha values
    expect(alphas.size).toBeGreaterThan(10);
  });

  it("returns a THREE.DataTexture instance", () => {
    const tex = createNoiseTexture(32, 1, 4, 2);
    expect(tex).toBeInstanceOf(THREE.DataTexture);
  });
});
