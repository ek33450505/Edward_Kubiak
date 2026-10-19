import { describe, it, expect } from "vitest";

import {
  buildRoutes,
  checkPageContent,
  detectTrap,
  expectedContent,
  hasFocusIndicator,
  isFocusObscured,
  resolveRoutes,
  summarize,
} from "./a11y-checks.mjs";

describe("buildRoutes", () => {
  it("lists meta routes, project routes, then the 404 path", () => {
    const routes = buildRoutes({ "/": {}, "/about": {} }, [{ slug: "a" }, { slug: "b" }]);
    expect(routes).toEqual(["/", "/about", "/projects/a", "/projects/b", "/no-such-page"]);
  });

  it("de-duplicates", () => {
    expect(buildRoutes({ "/no-such-page": {} }, [])).toEqual(["/no-such-page"]);
  });
});

describe("resolveRoutes", () => {
  const known = ["/", "/about"];
  it("returns the known list when nothing was requested", () => {
    expect(resolveRoutes(null, known)).toEqual(known);
  });
  it("returns a valid selection", () => {
    expect(resolveRoutes(["/about"], known)).toEqual(["/about"]);
  });
  it("throws on an empty selection", () => {
    expect(() => resolveRoutes([], known)).toThrow(/0 routes/);
  });
  it("throws on an unknown route", () => {
    expect(() => resolveRoutes(["/", "/nope"], known)).toThrow(/unknown route.*\/nope/);
  });
});

describe("expectedContent", () => {
  const meta = { "/": { title: "Home T" }, "/about": { title: "About T" } };
  const projects = [{ slug: "a", title: "Alpha" }];
  it("uses the exact ROUTE_META title", () => {
    expect(expectedContent("/about", meta, projects)).toEqual({ title: "About T" });
  });
  it("uses the project title for project pages", () => {
    expect(expectedContent("/projects/a", meta, projects)).toEqual({ titleIncludes: "Alpha" });
  });
  it("expects the NotFound page for the 404 path", () => {
    expect(expectedContent("/no-such-page", meta, projects)).toMatchObject({ h1Includes: "Page not found" });
  });
});

describe("checkPageContent", () => {
  const ok = { status: 200, h1s: ["About"], mainTextLength: 120, errorBoundary: false, title: "About T" };
  const expected = { title: "About T" };
  it("passes a healthy page", () => {
    expect(checkPageContent(ok, expected)).toEqual([]);
  });
  it("flags a non-200 status", () => {
    expect(checkPageContent({ ...ok, status: 404 }, expected).join()).toMatch(/status 404/);
  });
  it("flags a missing, empty or duplicated h1", () => {
    expect(checkPageContent({ ...ok, h1s: [] }, expected).join()).toMatch(/found 0/);
    expect(checkPageContent({ ...ok, h1s: ["a", "b"] }, expected).join()).toMatch(/found 2/);
    expect(checkPageContent({ ...ok, h1s: ["  "] }, expected).join()).toMatch(/empty/);
  });
  it("flags an empty main", () => {
    expect(checkPageContent({ ...ok, mainTextLength: 0 }, expected).join()).toMatch(/main/);
  });
  it("flags the error boundary", () => {
    expect(checkPageContent({ ...ok, errorBoundary: true }, expected).join()).toMatch(/error boundary/);
  });
  it("flags a wrong exact title and a missing title substring", () => {
    expect(checkPageContent({ ...ok, title: "x" }, expected).join()).toMatch(/!==/);
    expect(checkPageContent(ok, { titleIncludes: "Alpha" }).join()).toMatch(/does not contain "Alpha"/);
  });
  it("fails when the route has no expected title", () => {
    expect(checkPageContent(ok, {}).join()).toMatch(/no expected title/);
    expect(checkPageContent(ok, { titleIncludes: "" }).join()).toMatch(/no expected title/);
    expect(checkPageContent(ok, { title: "" }).join()).toMatch(/no expected title/);
  });
  it("flags a 404 page that did not render NotFound", () => {
    expect(checkPageContent(ok, { h1Includes: "Page not found" }).join()).toMatch(/does not contain/);
  });
});

describe("hasFocusIndicator", () => {
  const none = { outlineStyle: "none", outlineWidth: "0px", outlineColor: "rgb(0, 0, 0)", boxShadow: "none" };
  const outline = { outlineStyle: "solid", outlineWidth: "2px", outlineColor: "rgb(242, 169, 59)", boxShadow: "none" };
  const ring = { ...none, boxShadow: "rgb(242, 169, 59) 0px 0px 0px 2px" };

  it("fails when nothing is visible", () => {
    expect(hasFocusIndicator(none, none)).toBe(false);
  });
  it("accepts a real outline that appears on focus", () => {
    expect(hasFocusIndicator(outline, none)).toBe(true);
  });
  it("accepts a box-shadow ring that appears on focus", () => {
    expect(hasFocusIndicator(ring, none)).toBe(true);
  });
  it("rejects an outline that was already there before focus", () => {
    expect(hasFocusIndicator(outline, outline)).toBe(false);
  });
  it("rejects an unchanged decorative resting shadow", () => {
    const decor = { ...none, boxShadow: "rgba(0, 0, 0, 0.5) 0px 4px 8px 0px" };
    expect(hasFocusIndicator(decor, decor)).toBe(false);
  });
  it("rejects a transparent outline colour", () => {
    expect(hasFocusIndicator({ ...outline, outlineColor: "rgba(242, 169, 59, 0)" }, none)).toBe(false);
    expect(hasFocusIndicator({ ...outline, outlineColor: "color(srgb 1 0.5 0 / 0)" }, none)).toBe(false);
  });
  it("rejects a zero-width outline", () => {
    expect(hasFocusIndicator({ ...outline, outlineWidth: "0px" }, none)).toBe(false);
  });
  it("rejects a zero-spread, zero-blur shadow and a transparent shadow", () => {
    expect(hasFocusIndicator({ ...none, boxShadow: "rgb(0, 0, 0) 0px 0px 0px 0px" }, none)).toBe(false);
    expect(hasFocusIndicator({ ...none, boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 3px" }, none)).toBe(false);
  });
  it("accepts a changed, visible shadow among several layers", () => {
    const multi = { ...none, boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(1, 2, 3) 0px 0px 2px 1px" };
    expect(hasFocusIndicator(multi, none)).toBe(true);
  });
  it("falls back to a changed indicator on the parent a/button", () => {
    expect(hasFocusIndicator(none, none, { focused: outline, baseline: none })).toBe(true);
    expect(hasFocusIndicator(none, none, { focused: outline, baseline: outline })).toBe(false);
    expect(hasFocusIndicator(none, none, { focused: none, baseline: none })).toBe(false);
  });
});

describe("detectTrap", () => {
  const stops = (n) => Array.from({ length: n }, (_, i) => `e${i}`);

  it("passes a healthy sequence that has not wrapped", () => {
    expect(detectTrap(["a", "b", "c", "d"], 10).trapped).toBe(false);
  });
  it("catches 3 consecutive identical stops", () => {
    expect(detectTrap(["a", "b", "b", "b"], 4).trapped).toBe(true);
  });
  it("allows 2 consecutive identical stops", () => {
    expect(detectTrap(["a", "b", "b", "c"], 4).trapped).toBe(false);
  });
  it("catches a two-element ping-pong", () => {
    const seq = Array.from({ length: 12 }, (_, i) => (i % 2 ? "y" : "x"));
    expect(detectTrap(seq, 20).trapped).toBe(true);
  });
  it("catches a 3-element cycle repeated over 80 Tabs on a 40-stop page", () => {
    const seq = Array.from({ length: 80 }, (_, i) => ["a", "b", "c"][i % 3]);
    const res = detectTrap(seq, 40);
    expect(res.trapped).toBe(true);
    expect(res.reason).toMatch(/3 of 40/);
  });
  it("fails closed when the tab-stop count is 0 but focus moved", () => {
    const res = detectTrap(["a", "b", "c", "a", "b", "c"], 0);
    expect(res.trapped).toBe(true);
    expect(res.reason).toMatch(/count is 0/);
  });
  it("fails closed when focus reaches more stops than were counted", () => {
    expect(detectTrap(["a", "b", "c", "d"], 3).trapped).toBe(true);
  });
  it("a short all-body walk under the repeat threshold is not a trap", () => {
    expect(detectTrap(["body", "body"], 0).trapped).toBe(false);
  });
  it("a long all-body walk is a trap even against a zero count", () => {
    const res = detectTrap(Array(20).fill("body"), 0);
    expect(res.trapped).toBe(true);
    expect(res.reason).toMatch(/stuck on body/);
  });
  it("accepts a full wrap that covered the page", () => {
    const seq = [...stops(10), "e0", "e1"];
    expect(detectTrap(seq, 10).trapped).toBe(false);
  });
  it("accepts a wrap through body", () => {
    const seq = [...stops(10), "body", "e0"];
    expect(detectTrap(seq, 10).trapped).toBe(false);
  });
  it("accepts a wrap at 90% coverage but not far below it", () => {
    expect(detectTrap([...stops(9), "e0"], 10).trapped).toBe(false);
    expect(detectTrap([...stops(8), "e0"], 10).trapped).toBe(true);
  });
  it("flags 10 Tabs with no new stop before any wrap", () => {
    const seq = ["a", "b", "c", "d", ...Array.from({ length: 12 }, (_, i) => ["b", "c"][i % 2])];
    expect(detectTrap(seq, 50).trapped).toBe(true);
  });
});

describe("isFocusObscured", () => {
  const viewport = { width: 1000, height: 800 };
  const rect = { width: 100, height: 20, left: 10, top: 10, right: 110, bottom: 30 };
  it("passes when any sampled point hits the element", () => {
    expect(isFocusObscured({ rect, viewport, hits: [false, true, false, false, false] })).toBeNull();
  });
  it("flags full coverage", () => {
    expect(isFocusObscured({ rect, viewport, hits: [false, false, false, false, false] })).toBe("covered");
  });
  it("flags zero area", () => {
    expect(isFocusObscured({ rect: { ...rect, width: 0 }, viewport, hits: [true] })).toBe("zero-area");
  });
  it("flags an element scrolled outside the viewport", () => {
    const off = { ...rect, top: 900, bottom: 920 };
    expect(isFocusObscured({ rect: off, viewport, hits: [true] })).toBe("outside-viewport");
  });
});

describe("summarize", () => {
  const clean = {
    routes: [{ route: "/", axe: { desktop: [], mobile: [] }, reflow: { fail: false }, keyboard: { failures: [] } }],
    probes: [{ name: "palette", failures: [] }],
  };
  it("exits 0 on a clean run", () => {
    expect(summarize(clean)).toEqual({ failures: [], exitCode: 0 });
  });
  it("exits 1 and flattens every failure kind", () => {
    const dirty = {
      routes: [{
        route: "/about",
        axe: { desktop: [{ id: "image-alt", impact: "critical", nodes: 1, targets: ["img"] }], mobile: [] },
        reflow: { fail: true, scrollWidth: 400, innerWidth: 320 },
        keyboard: { failures: [{ kind: "no-focus-indicator", detail: "a.x" }] },
      }],
      probes: [{ name: "palette", failures: ["did not open"] }],
    };
    const { failures, exitCode } = summarize(dirty);
    expect(exitCode).toBe(1);
    expect(failures.map((f) => f.check)).toEqual(["axe-desktop", "reflow", "keyboard", "probe"]);
  });
  it("reports content failures as failures", () => {
    const r = { routes: [{ route: "/x", content: { desktop: ["<main> is empty"], mobile: [] } }], probes: [] };
    const { failures, exitCode } = summarize(r);
    expect(exitCode).toBe(1);
    expect(failures[0]).toMatchObject({ route: "/x", check: "content-desktop" });
  });
  it("exits 2 on a harness error", () => {
    expect(summarize({ harnessError: "boom", routes: [] }).exitCode).toBe(2);
  });
});
