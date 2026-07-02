/**
 * webgl.js — WebGL availability detection utility.
 *
 * Provides a synchronous, dependency-free check for WebGL support.
 * SSR-safe: returns false when `document` is not available.
 *
 * Usage:
 *   import { isWebGLAvailable } from './webgl';
 *   if (!isWebGLAvailable()) { return <Fallback />; }
 */

/**
 * Detect whether WebGL is available in the current environment.
 *
 * Creates a throwaway <canvas>, attempts to obtain a WebGL rendering context,
 * and immediately discards it. Returns `true` if a context was obtained,
 * `false` otherwise (no WebGL support, driver failure, or SSR/Node environment).
 *
 * @returns {boolean}
 */
export function isWebGLAvailable() {
  if (typeof document === 'undefined') {
    // SSR / Node — no DOM available; treat as unavailable.
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!ctx;
  } catch {
    // Context creation threw (e.g. driver crash, browser sandbox).
    return false;
  }
}
