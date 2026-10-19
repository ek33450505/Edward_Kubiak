import { describe, it, expect } from "vitest";

import {
  STATUSES,
  W,
  H,
  albers,
  CONUS,
  projectPoint,
  mapStatus,
  buildPayload,
  isValidRaw,
  shouldWrite,
  INSET_RECTS,
  SOURCE_URL,
  withCacheBust,
  CONUS_ANCHORS,
  isValidPayload,
  buildSummary,
  summaryModule,
} from "./sync-atlas-points.mjs";

const pt = (id, lat, lon, status = "operational") => ({ id, lat, lon, status });

describe("mapStatus", () => {
  it("maps all five statuses to their index", () => {
    expect(mapStatus("operational")).toBe(0);
    expect(mapStatus("under_construction")).toBe(1);
    expect(mapStatus("permitted")).toBe(2);
    expect(mapStatus("proposed")).toBe(3);
    expect(mapStatus("cancelled")).toBe(4);
  });

  it("returns -1 for unknown or non-string values", () => {
    expect(mapStatus("retired")).toBe(-1);
    expect(mapStatus(undefined)).toBe(-1);
    expect(mapStatus(3)).toBe(-1);
  });
});

describe("albers", () => {
  it("puts the origin (p0, l0) at x=0,y=0", () => {
    const [x, y] = albers(37.5, -96, CONUS);
    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(0, 9);
  });

  it("moves east to larger x and north to larger y (math orientation)", () => {
    expect(albers(37.5, -90, CONUS)[0]).toBeGreaterThan(0);
    expect(albers(45, -96, CONUS)[1]).toBeGreaterThan(0);
  });
});

describe("projectPoint", () => {
  const seattle = projectPoint(47.6, -122.3);
  const miami = projectPoint(25.8, -80.2);
  const bangor = projectPoint(44.8, -68.8);
  const anchorage = projectPoint(61.2, -149.9);
  const honolulu = projectPoint(21.3, -157.9);
  const sanJuan = projectPoint(18.47, -66.1);

  it("places Seattle in the top-left quadrant", () => {
    expect(seattle[0]).toBeLessThan(W / 2);
    expect(seattle[1]).toBeLessThan(H / 2);
  });

  it("places Miami right of and below Seattle, in the CONUS area", () => {
    expect(miami[0]).toBeGreaterThan(W / 2);
    expect(miami[1]).toBeGreaterThan(seattle[1]);
    expect(miami[1]).toBeLessThan(H);
  });

  it("places Bangor further right than Miami and in the top half", () => {
    expect(bangor[0]).toBeGreaterThan(miami[0]);
    expect(bangor[1]).toBeLessThan(H / 2);
  });

  it("places the insets in the lower corners: Alaska left, Hawaii right of it, PR lower-right", () => {
    for (const p of [anchorage, honolulu, sanJuan]) expect(p[1]).toBeGreaterThan(H * 0.7);
    expect(anchorage[0]).toBeLessThan(W / 4);
    expect(honolulu[0]).toBeGreaterThan(anchorage[0]);
    expect(honolulu[0]).toBeLessThan(W / 2);
    expect(sanJuan[0]).toBeGreaterThan(W * 0.8);
  });

  it("routes Guam and Saipan into the GU/MP inset", () => {
    for (const p of [projectPoint(13.4, 144.8), projectPoint(15.2, 145.7)]) {
      expect(p).not.toBeNull();
      const r = INSET_RECTS.GU;
      expect(p[0]).toBeGreaterThanOrEqual(r.x0);
      expect(p[0]).toBeLessThanOrEqual(r.x1);
      expect(p[1]).toBeGreaterThanOrEqual(r.y0);
      expect(p[1]).toBeLessThanOrEqual(r.y1);
    }
  });

  it("keeps the aspect in the 1.5-1.9 range", () => {
    expect(W / H).toBeGreaterThan(1.5);
    expect(W / H).toBeLessThan(1.9);
  });

  it("returns integers within the canvas for every region", () => {
    for (const p of [seattle, miami, bangor, anchorage, honolulu, sanJuan, projectPoint(51.9, 172.0), projectPoint(13.4, 144.8)]) {
      expect(p).not.toBeNull();
      for (const v of p) expect(Number.isInteger(v)).toBe(true);
      expect(p[0]).toBeGreaterThanOrEqual(0);
      expect(p[0]).toBeLessThanOrEqual(W);
      expect(p[1]).toBeGreaterThanOrEqual(0);
      expect(p[1]).toBeLessThanOrEqual(H);
    }
  });

  it("drops points outside every region (American Samoa, mid-Pacific)", () => {
    expect(projectPoint(-14.3, -170.7)).toBeNull();
    expect(projectPoint(0, 0)).toBeNull();
  });
});

describe("CONUS anchors", () => {
  const pts = CONUS_ANCHORS.map(([lat, lon]) => projectPoint(lat, lon));

  it("projects every anchor inside the canvas", () => {
    for (const p of pts) {
      expect(p).not.toBeNull();
      expect(p[0]).toBeGreaterThanOrEqual(0);
      expect(p[0]).toBeLessThanOrEqual(W);
      expect(p[1]).toBeGreaterThanOrEqual(0);
      expect(p[1]).toBeLessThanOrEqual(H);
    }
  });

  it("spans at least 90% of the canvas width", () => {
    const xs = pts.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(W * 0.9);
  });
});

describe("inset rectangles", () => {
  const inside = (p, r) => p[0] >= r.x0 && p[0] <= r.x1 && p[1] >= r.y0 && p[1] <= r.y1;
  const edgeCities = {
    "San Diego": [32.7, -117.2],
    Tucson: [32.2, -110.9],
    "El Paso": [31.8, -106.4],
    Brownsville: [25.9, -97.5],
    "Key West": [24.6, -81.8],
    Miami: [25.8, -80.2],
    "Cape Hatteras": [35.2, -75.5],
    "Big Bend": [29.2, -103.2],
    "Corpus Christi": [27.8, -97.4],
  };

  for (const [city, [lat, lon]] of Object.entries(edgeCities)) {
    it(`keeps ${city} outside every inset rectangle`, () => {
      const p = projectPoint(lat, lon);
      for (const r of Object.values(INSET_RECTS)) expect(inside(p, r)).toBe(false);
    });
  }

  it("keeps each inset point inside its own rectangle and inside the canvas", () => {
    const samples = {
      AK: [[61.2, -149.9], [71.3, -156.8], [51.9, 172.0], [55, -131.5]],
      HI: [[21.3, -157.9], [19.7, -155.1], [22.0, -159.5]],
      GU: [[13.4, 144.8], [15.2, 145.7]],
      PR: [[18.47, -66.1], [18.35, -64.9], [17.7, -64.8]],
    };
    for (const [region, pts] of Object.entries(samples)) {
      for (const [lat, lon] of pts) {
        const p = projectPoint(lat, lon);
        expect(inside(p, INSET_RECTS[region])).toBe(true);
        expect(p[0]).toBeGreaterThanOrEqual(0);
        expect(p[0]).toBeLessThanOrEqual(W);
        expect(p[1]).toBeGreaterThanOrEqual(0);
        expect(p[1]).toBeLessThanOrEqual(H);
      }
    }
  });

  it("keeps the insets from overlapping one another", () => {
    const rs = Object.values(INSET_RECTS);
    for (let i = 0; i < rs.length; i++)
      for (let j = i + 1; j < rs.length; j++)
        expect(rs[i].x1 < rs[j].x0 || rs[j].x1 < rs[i].x0 || rs[i].y1 < rs[j].y0 || rs[j].y1 < rs[i].y0).toBe(true);
  });
});

describe("isValidRaw", () => {
  const good = Array.from({ length: 10 }, (_, i) => pt(i, 40, -100));

  it("accepts a clean feed", () => {
    expect(isValidRaw(good, 0)).toBe(true);
  });

  it("rejects non-arrays and empty arrays", () => {
    expect(isValidRaw(null)).toBe(false);
    expect(isValidRaw({ a: 1 })).toBe(false);
    expect(isValidRaw([])).toBe(false);
  });

  it("rejects a feed with fewer than 90% valid entries", () => {
    const bad = [...good.slice(0, 8), pt(98, 999, 0), pt(99, 40, -100, "nope")];
    expect(isValidRaw(bad)).toBe(false);
  });

  it("tolerates up to 10% invalid entries", () => {
    expect(isValidRaw([...good.slice(0, 9), pt(99, 999, 0)])).toBe(true);
  });

  it("rejects a feed under 50% of the previous count", () => {
    expect(isValidRaw(good, 21)).toBe(false);
    expect(isValidRaw(good, 20)).toBe(true);
  });
});

describe("buildPayload", () => {
  const raw = [
    pt(1, 47.6, -122.3, "operational"),
    pt(2, 25.8, -80.2, "proposed"),
    pt(3, -14.3, -170.7, "permitted"), // American Samoa — dropped
    pt(4, 999, 0, "operational"), // invalid — dropped
    pt(5, 61.2, -149.9, "cancelled"),
  ];
  const payload = buildPayload(raw, { asOf: "2026-10-19" });

  it("counts kept and dropped entries", () => {
    expect(payload.count).toBe(3);
    expect(payload.dropped).toBe(2);
    expect(payload.asOf).toBe("2026-10-19");
    expect(payload.w).toBe(W);
    expect(payload.h).toBe(H);
    expect(payload.statuses).toEqual(STATUSES);
  });

  it("emits a flat x,y,s array of length 3*count with valid status ints", () => {
    expect(payload.pts).toHaveLength(payload.count * 3);
    expect(payload.pts[2]).toBe(0);
    expect(payload.pts[5]).toBe(3);
    expect(payload.pts[8]).toBe(4);
  });
});

describe("shouldWrite (anti-churn)", () => {
  const prev = buildPayload([pt(1, 47.6, -122.3)], { asOf: "2026-10-18" });

  it("writes when there is no previous file", () => {
    expect(shouldWrite(null, prev)).toBe(true);
  });

  it("does not write when only asOf differs", () => {
    expect(shouldWrite(prev, buildPayload([pt(1, 47.6, -122.3)], { asOf: "2026-10-19" }))).toBe(false);
  });

  it("writes when points, count or dropped change", () => {
    expect(shouldWrite(prev, buildPayload([pt(1, 47.6, -122.3, "proposed")], { asOf: "x" }))).toBe(true);
    expect(shouldWrite(prev, buildPayload([pt(1, 47.6, -122.3), pt(2, 30, -90)], { asOf: "x" }))).toBe(true);
    expect(shouldWrite(prev, buildPayload([pt(1, 47.6, -122.3), pt(2, -14.3, -170.7)], { asOf: "x" }))).toBe(true);
  });
});

describe("withCacheBust", () => {
  it("adds ?t= to a URL without a query", () => {
    expect(withCacheBust("https://example.com/a.json", 123)).toBe("https://example.com/a.json?t=123");
  });

  it("adds &t= to a URL that already has a query and replaces an old t", () => {
    expect(withCacheBust("https://example.com/a.json?v=2", 123)).toBe("https://example.com/a.json?v=2&t=123");
    expect(withCacheBust("https://example.com/a.json?t=1", 123)).toBe("https://example.com/a.json?t=123");
  });

  it("leaves the exported source URL clean and out of the payload", () => {
    expect(SOURCE_URL).not.toContain("?");
    expect(buildPayload([], { asOf: "x" }).source).toBe(SOURCE_URL);
  });
});

describe("isValidPayload", () => {
  it("rejects a payload where more than 10% of entries fell outside every region", () => {
    expect(isValidPayload({ count: 100, dropped: 10 })).toBe(true);
    expect(isValidPayload({ count: 100, dropped: 11 })).toBe(false);
    expect(isValidPayload({ count: 0, dropped: 0 })).toBe(false);
  });
});

describe("inset rectangles vs CONUS anchors", () => {
  it("keeps every projected CONUS anchor outside every inset rectangle", () => {
    for (const [lat, lon] of CONUS_ANCHORS) {
      const p = projectPoint(lat, lon);
      for (const r of Object.values(INSET_RECTS)) {
        expect(p[0] >= r.x0 && p[0] <= r.x1 && p[1] >= r.y0 && p[1] <= r.y1).toBe(false);
      }
    }
  });
});

describe("buildSummary", () => {
  it("counts every status, sums to count, and keeps zero-count keys", () => {
    const payload = buildPayload(
      [pt(1, 39, -98), pt(2, 40, -99, "under_construction"), pt(3, 41, -97, "operational")],
      { asOf: "2026-01-01" },
    );
    const sum = buildSummary(payload);
    expect(Object.keys(sum.byStatus)).toEqual(STATUSES);
    expect(sum.byStatus).toMatchObject({ operational: 2, under_construction: 1, permitted: 0, proposed: 0, cancelled: 0 });
    expect(Object.values(sum.byStatus).reduce((a, b) => a + b, 0)).toBe(sum.count);
    expect(sum).toMatchObject({ asOf: "2026-01-01", count: 3, w: W, h: H });
  });

  it("emits an importable-looking module with the ATLAS_POINTS export", () => {
    const text = summaryModule(buildSummary(buildPayload([pt(1, 39, -98)], { asOf: "2026-01-01" })));
    expect(text).toContain("AUTO-GENERATED");
    expect(text).toContain("export const ATLAS_POINTS = {");
  });
});

describe("committed generated files", () => {
  it("src/data/atlasPoints.js matches buildSummary(public/atlas-points.json)", async () => {
    const fs = await import("node:fs");
    const { ATLAS_POINTS } = await import("../src/data/atlasPoints.js");
    const json = JSON.parse(fs.readFileSync(`${import.meta.dirname}/../public/atlas-points.json`, "utf8"));
    expect(ATLAS_POINTS).toEqual(buildSummary(json));
  });
});
