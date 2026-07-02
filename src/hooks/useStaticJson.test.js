/**
 * Tests for useStaticJson.js
 *
 * @testing-library/react is not installed in this project, so renderHook
 * is unavailable.  The fetch/cancel/fallback logic lives inside a useEffect
 * and cannot be exercised without a React render environment; therefore this
 * file verifies only the module's export contract (function existence and
 * module shape).
 *
 * The analogous constraint is documented in useGitHubStars.test.js, which
 * tests only fetchStarsMap (a plain async function) and asserts the hook is
 * a function.  Full integration coverage of useStaticJson behaviour lives in
 * the visual QA / E2E pass where the consuming components are exercised
 * in-browser.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("useStaticJson — export contract", () => {
  it("is exported as a named function", async () => {
    const { useStaticJson } = await import("./useStaticJson");
    expect(typeof useStaticJson).toBe("function");
  });
});

describe("useStaticJson — module shape", () => {
  it("has no default export — only the named useStaticJson export", async () => {
    const mod = await import("./useStaticJson");
    expect(mod.default).toBeUndefined();
    expect(Object.keys(mod)).toEqual(["useStaticJson"]);
  });
});
