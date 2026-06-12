/**
 * textures.js — Deterministic DataTexture generators for TrailTerrain art pass.
 *
 * DESIGN DECISION: THREE.DataTexture, not canvas.
 * ─────────────────────────────────────────────────────────────────────────────
 * Canvas-based texture generation requires `document.createElement("canvas")`
 * which is unavailable in vitest's node environment.  DataTexture is a pure JS
 * class in three.js — no DOM, no WebGL context, no `document`.  Callers get
 * clean imports in vitest node env, and output is bit-deterministic: identical
 * inputs always produce identical Uint8Array pixel data regardless of platform,
 * GPU, or browser.  Calling code wraps creation in useMemo and calls
 * texture.dispose() on unmount.
 *
 * DETERMINISM CONTRACT:
 * All randomness routes through mulberry32 from ./prng.js.  No Math.random()
 * is used anywhere in this file.  Given the same (size, seed, lattice, octaves)
 * arguments the returned texture's image.data array is always byte-identical.
 *
 * Pure parameterized functions only — constants belong in constants.js.
 * Consumers call inside useMemo; cleanup via texture.dispose().
 *
 * @module textures
 */

import * as THREE from "three";
import { mulberry32 } from "./prng.js";

// ---------------------------------------------------------------------------
// Radial glow sprite — shared by Fireflies and Headlamp
// ---------------------------------------------------------------------------

/**
 * Creates a square RGBA DataTexture containing a soft radial glow.
 *
 * rgb channels are always 255 so the sprite colour is driven entirely by the
 * material's colour; alpha encodes the radial falloff.  Pixels outside the
 * inscribed circle (dist > halfSize) receive alpha 0 — corner alpha is always 0.
 *
 * @param {number} size         - Square texture dimension in pixels (e.g. 64)
 * @param {number} falloffExp   - Power exponent for the radial curve. 1 = linear,
 *                                2 = quadratic soft, higher = tighter centre glow.
 * @returns {THREE.DataTexture}
 */
export function createRadialGlowTexture(size, falloffExp) {
  const data = new Uint8Array(size * size * 4);
  const halfSize = size / 2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Pixel-centre coords relative to texture centre
      const dx = px + 0.5 - halfSize;
      const dy = py + 0.5 - halfSize;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Falloff: 1 at centre, 0 at radius = halfSize, clamped to [0,1]
      const t = Math.max(0, 1 - dist / halfSize);
      const alpha = Math.round(255 * Math.pow(t, falloffExp));

      const i = (py * size + px) * 4;
      data[i] = 255;       // r
      data[i + 1] = 255;   // g
      data[i + 2] = 255;   // b
      data[i + 3] = alpha; // a
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Tiling value-noise texture — used by Mist for UV-drift animation
// ---------------------------------------------------------------------------

/**
 * Smoothstep fade curve for bilinear interpolation.
 * S-curve that makes value transitions look organic rather than blocky.
 * @param {number} t - value in [0, 1]
 * @returns {number}
 */
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Creates a square RGBA DataTexture containing tiling value noise.
 *
 * TILING CONTRACT: lattice indices wrap modulo the lattice dimension.  Combined
 * with integer frequency multipliers, the texture is perfectly seamless — the
 * right edge blends into the left edge and the top into the bottom.  Consumers
 * set material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping and drive
 * the repeating pattern with map.offset drift in useFrame.
 *
 * Each successive octave samples the SAME random lattice at 2× the spatial
 * frequency and ½ the amplitude.  This is equivalent to fractional Brownian
 * motion but using a single seeded lattice — computationally cheap and still
 * produces convincing organic detail.
 *
 * rgb channels are always 255; alpha channel encodes normalised noise [0, 255].
 * The material colour tints the noise; alpha drives opacity variations.
 *
 * @param {number} size     - Square texture dimension in pixels (e.g. 128)
 * @param {number} seed     - 32-bit unsigned integer seed for mulberry32
 * @param {number} lattice  - Grid dimension for value noise (e.g. 4). Must be ≥ 2.
 * @param {number} octaves  - Number of fBm octaves (e.g. 3). Each doubles freq, halves amp.
 * @returns {THREE.DataTexture}
 */
export function createNoiseTexture(size, seed, lattice, octaves) {
  const rng = mulberry32(seed);

  // Build seeded random value lattice
  const grid = new Float32Array(lattice * lattice);
  for (let i = 0; i < lattice * lattice; i++) {
    grid[i] = rng();
  }

  /**
   * Bilinearly interpolate the wrapped lattice at continuous coords (lx, ly).
   * Wrapping ensures the texture tiles: lx == lattice maps back to 0.
   */
  function sampleLattice(lx, ly) {
    const ix0 = Math.floor(lx);
    const iy0 = Math.floor(ly);
    const x0 = ((ix0 % lattice) + lattice) % lattice; // guard negative from float imprecision
    const y0 = ((iy0 % lattice) + lattice) % lattice;
    const x1 = (x0 + 1) % lattice;
    const y1 = (y0 + 1) % lattice;

    const fx = smoothstep(lx - ix0);
    const fy = smoothstep(ly - iy0);

    const v00 = grid[y0 * lattice + x0];
    const v10 = grid[y0 * lattice + x1];
    const v01 = grid[y1 * lattice + x0];
    const v11 = grid[y1 * lattice + x1];

    // Standard bilinear combination
    return (
      v00 * (1 - fx) * (1 - fy) +
      v10 * fx * (1 - fy) +
      v01 * (1 - fx) * fy +
      v11 * fx * fy
    );
  }

  // Pre-compute amplitude normalisation constant (sum of a geometric series)
  let ampSum = 0;
  for (let o = 0; o < octaves; o++) {
    ampSum += Math.pow(0.5, o);
  }

  const data = new Uint8Array(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Normalised UV in [0, 1) — avoids sampling exactly at 1.0 to keep tiling crisp
      const u = px / size;
      const v = py / size;

      let noise = 0;
      for (let o = 0; o < octaves; o++) {
        // freq doubles per octave; amplitude halves.  Sampling at freq*lattice points
        // across the [0,1) range — integer multiples guarantee seamless wrapping.
        const freq = Math.pow(2, o);
        const amp = Math.pow(0.5, o);
        const lx = (u * lattice * freq) % lattice;
        const ly = (v * lattice * freq) % lattice;
        noise += sampleLattice(lx, ly) * amp;
      }

      const normalized = noise / ampSum; // in [0, 1]
      const alpha = Math.round(normalized * 255);

      const i = (py * size + px) * 4;
      data[i] = 255;       // r
      data[i + 1] = 255;   // g
      data[i + 2] = 255;   // b
      data[i + 3] = alpha; // a
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
