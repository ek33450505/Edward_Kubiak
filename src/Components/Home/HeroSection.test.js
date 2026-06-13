/**
 * HeroSection.test.js — import contract regression tests.
 *
 * Regression: a review-fix removed `useReducedMotion` from the motion/react import
 * claiming it was unused. ScrollCue (defined in the same file) calls useReducedMotion()
 * at line 13, causing a ReferenceError at runtime that Vite's build step cannot catch.
 *
 * These tests guard the import surface of HeroSection.jsx by reading the source file
 * directly — no component rendering required, no WebGL/React context needed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, 'HeroSection.jsx'), 'utf8');

/** Extract the named-import list from the motion/react import line. */
function motionImports(source) {
  const match = source.match(/^import\s+\{([^}]+)\}\s+from\s+["']motion\/react["']/m);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim()).filter(Boolean);
}

describe('HeroSection — motion/react import contract', () => {
  it('imports useReducedMotion (regression: ScrollCue runtime ReferenceError)', () => {
    // This assertion fails on the unfixed file where `useReducedMotion` was removed.
    expect(motionImports(src)).toContain('useReducedMotion');
  });

  it('retains core motion imports that the JSX body uses', () => {
    const imports = motionImports(src);
    // If any of these disappear a reviewer has incorrectly pruned a live reference.
    expect(imports).toContain('motion');
    expect(imports).toContain('AnimatePresence');
  });
});
