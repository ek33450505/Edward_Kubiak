/**
 * Vitest global test setup.
 *
 * - Imports @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
 * - Tears down the jsdom DOM after each test so leaks between tests are impossible.
 * - Polyfills IntersectionObserver for jsdom: motion/react's `whileInView` feature
 *   requires it. The stub is a no-op — elements stay in their initial variant state —
 *   but the DOM structure and links are fully rendered and queryable.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom does not implement IntersectionObserver; stub it so motion/react
// whileInView animations don't throw. Elements render (opacity may be 0)
// but are still present in the DOM and accessible to RTL queries.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
