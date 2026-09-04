import { describe, it, expect } from "vitest";
import { STATIC_ROUTES } from "./generate-sitemap.mjs";
import { ROUTE_META } from "../src/data/routeMeta.js";

describe("generate-sitemap STATIC_ROUTES / ROUTE_META parity", () => {
  it("has an exactly matching set of paths — no drift in either direction", () => {
    const sitemapPaths = new Set(STATIC_ROUTES.map((r) => r.path));
    const routeMetaPaths = new Set(Object.keys(ROUTE_META));
    expect(sitemapPaths).toEqual(routeMetaPaths);
  });

  it("gives every route a non-empty sources array", () => {
    for (const route of STATIC_ROUTES) {
      expect(Array.isArray(route.sources)).toBe(true);
      expect(route.sources.length).toBeGreaterThan(0);
    }
  });

  it("gives every route a valid priority and changefreq", () => {
    const validChangefreq = new Set([
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never",
    ]);
    for (const route of STATIC_ROUTES) {
      const priority = Number(route.priority);
      expect(priority).toBeGreaterThanOrEqual(0);
      expect(priority).toBeLessThanOrEqual(1);
      expect(validChangefreq.has(route.changefreq)).toBe(true);
    }
  });
});
