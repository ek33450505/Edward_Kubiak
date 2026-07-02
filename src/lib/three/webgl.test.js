/**
 * webgl.test.js
 *
 * Tests for the isWebGLAvailable() WebGL detection utility.
 * Runs in the default jsdom environment — jsdom has no real WebGL,
 * so isWebGLAvailable() should return false gracefully (not throw).
 *
 * Covers:
 *  - Return type is always boolean
 *  - No throw in jsdom (graceful degradation)
 *  - Returns false in jsdom (no real WebGL context)
 */

import { describe, it, expect } from 'vitest';
import { isWebGLAvailable } from './webgl';

describe('isWebGLAvailable', () => {
  it('returns a boolean', () => {
    const result = isWebGLAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('does not throw in a jsdom environment', () => {
    expect(() => isWebGLAvailable()).not.toThrow();
  });

  it('returns false in jsdom (no real WebGL context available)', () => {
    // jsdom does not implement WebGL — getContext('webgl') / 'webgl2' return null.
    // isWebGLAvailable() must gracefully return false rather than crash.
    expect(isWebGLAvailable()).toBe(false);
  });
});
