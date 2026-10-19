#!/usr/bin/env node
// Refreshes public/atlas-points.json from the live Compute Atlas hero points feed,
// so the hero "facility field" canvas can draw real facility locations. The file is
// fetched at runtime by the canvas (not imported into the JS bundle).
//
// Source: https://www.compute-atlas.com/data/hero-points.json
//   array of { id, lat, lon, status }; override with ATLAS_POINTS_URL.
//
// Output: { asOf, source, count, dropped, w, h, statuses, pts: [x,y,s, ...] }
//   x,y are integers in canvas space (y DOWN, 0<=x<=w, 0<=y<=h); s indexes `statuses`.
//
// Projection (all in-script, FIXED layout — never derived from the data, so the
// silhouette cannot shift between syncs): an AlbersUsa-style composite of spherical
// Albers equal-area conics.
//   n = (sin p1 + sin p2) / 2;  C = cos^2 p1 + 2n sin p1;  rho0 = sqrt(C - 2n sin p0) / n
//   rho = sqrt(C - 2n sin p) / n;  theta = n (lon - lon0);  x = rho sin theta;  y = rho0 - rho cos theta
//   - CONUS: p1=29.5 p2=45.5 p0=37.5 lon0=-96, fitted to a fixed lat/lon extent.
//   - Alaska inset (0.3x CONUS scale) in the empty lower-left corner of the CONUS box; Hawaii (1x), GU/MP
//     (1x) beside it, GU/MP via its own Albers; PR/USVI (1x) lower-right, east of FL. Canvas = projected bbox of the CONUS land anchors + 3%, w=2000, h from aspect.
//   Anything outside those regions (e.g. American Samoa) is dropped and counted.
//
// Never fails the build: on any fetch/validation failure the existing file is kept.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";

import { fetchJson } from "./lib/fetch-json.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outPath = path.join(root, "public", "atlas-points.json");

export const SOURCE_URL = "https://www.compute-atlas.com/data/hero-points.json";

export const STATUSES = ["operational", "under_construction", "permitted", "proposed", "cancelled"];
export const W = 2000;

// Inset anchors (left, bottom) as fractions of the canvas.
const ANCHORS = { ak: [0.01, 0.97], hi: [0.27, 0.97], gu: [0.405, 0.97], pr: [0.86, 0.9] };

const rad = (d) => (d * Math.PI) / 180;

export const CONUS = { p1: 29.5, p2: 45.5, p0: 37.5, l0: -96 };
export const ALASKA = { p1: 55, p2: 65, p0: 50, l0: -154 };
export const HAWAII = { p1: 8, p2: 18, p0: 19, l0: -157 };
export const GUAM = { p1: 13, p2: 16, p0: 14.5, l0: 145.5 };
export const PUERTO_RICO = { p1: 8, p2: 18, p0: 18, l0: -66 };

// Pure — raw Albers equal-area conic coordinates (unit sphere, math orientation:
// y grows NORTH). Canvas placement flips y.
export function albers(lat, lon, { p1, p2, p0, l0 }) {
  const n = (Math.sin(rad(p1)) + Math.sin(rad(p2))) / 2;
  const C = Math.cos(rad(p1)) ** 2 + 2 * n * Math.sin(rad(p1));
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(rad(p0))) / n;
  const rho = Math.sqrt(C - 2 * n * Math.sin(rad(lat))) / n;
  let dl = lon - l0;
  dl = ((((dl + 180) % 360) + 360) % 360) - 180; // wrap the Aleutians across the antimeridian
  const theta = n * rad(dl);
  return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
}

// Bounding box of a lat/lon extent under a projection: corners, edge midpoints and
// a dense edge sampling, since the cone curves parallels.
const toCanvasSpace = (lat, lon, params) => {
  const [x, y] = albers(lat, lon, params);
  return [x, -y];
};

function extentBox(params, { lat0, lat1, lon0, lon1 }) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const lat = lat0 + ((lat1 - lat0) * i) / steps;
    const lon = lon0 + ((lon1 - lon0) * i) / steps;
    for (const [la, lo] of [[lat, lon0], [lat, lon1], [lat0, lon], [lat1, lon]]) {
      const [x, y] = toCanvasSpace(la, lo, params);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

// Fixed land-extreme anchors (never data-derived). A lat/lon corner box would project
// the SE corner far out over the Atlantic, so the CONUS extent is the projected bbox
// of these instead.
export const CONUS_ANCHORS = [
  [48.38, -124.72], // Cape Flattery WA
  [40.44, -124.41], // Cape Mendocino CA
  [32.53, -117.12], // San Diego/Tijuana border
  [25.84, -97.4], // Brownsville TX
  [24.55, -81.8], // Key West FL
  [35.22, -75.53], // Cape Hatteras NC
  [44.81, -66.95], // Lubec ME
  [49.38, -95.15], // Northwest Angle MN
  [49.0, -123.08], // Point Roberts WA
];
// Inset extents are the strict routing boxes (AK, HI, PR) or a tight box around the
// islands (GU/MP); the placed rectangle of each is what the no-overlap test checks.
const AK_EXTENT = { lat0: 51, lat1: 71.5, lon0: -188, lon1: -129 };
const HI_EXTENT = { lat0: 18.8, lat1: 22.4, lon0: -160.6, lon1: -154.7 };
const GU_EXTENT = { lat0: 13, lat1: 16.5, lon0: 144.4, lon1: 146.2 };
const PR_EXTENT = { lat0: 17.6, lat1: 18.7, lon0: -67.4, lon1: -64.5 };

// Canvas = the fixed CONUS extent plus a 3% margin, w=2000; h follows the aspect.
const anchorXY = CONUS_ANCHORS.map(([la, lo]) => toCanvasSpace(la, lo, CONUS));
const cBox = {
  minX: Math.min(...anchorXY.map((p) => p[0])),
  maxX: Math.max(...anchorXY.map((p) => p[0])),
  minY: Math.min(...anchorXY.map((p) => p[1])),
  maxY: Math.max(...anchorXY.map((p) => p[1])),
};
const cW = cBox.maxX - cBox.minX;
const cH = cBox.maxY - cBox.minY;
const PAD = 0.03 * cW;
const SCALE = W / (cW + 2 * PAD);
export const H = Math.round((cH + 2 * PAD) * SCALE);
const cOffX = (PAD - cBox.minX) * SCALE;
const cOffY = (PAD - cBox.minY) * SCALE;

// Insets tuck into the empty corners of the CONUS box (like geoAlbersUsa). Each is
// anchored by the left/bottom edge of its extent box, given as fractions of the canvas.
function makeInset(params, extent, k, left, bottom) {
  const b = extentBox(params, extent);
  const s = SCALE * k;
  const offX = left * W - b.minX * s;
  const offY = bottom * H - b.maxY * s;
  const rect = {
    x0: Math.floor(b.minX * s + offX),
    x1: Math.ceil(b.maxX * s + offX),
    y0: Math.floor(b.minY * s + offY),
    y1: Math.ceil(b.maxY * s + offY),
  };
  return { params, s, offX, offY, rect };
}

const akInset = makeInset(ALASKA, AK_EXTENT, 0.3, ANCHORS.ak[0], ANCHORS.ak[1]);
const hiInset = makeInset(HAWAII, HI_EXTENT, 1, ANCHORS.hi[0], ANCHORS.hi[1]);
const guInset = makeInset(GUAM, GU_EXTENT, 1, ANCHORS.gu[0], ANCHORS.gu[1]);
const prInset = makeInset(PUERTO_RICO, PR_EXTENT, 1, ANCHORS.pr[0], ANCHORS.pr[1]);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function place(lat, lon, { params, s, offX, offY, rect }) {
  const [x, y] = toCanvasSpace(lat, lon, params);
  const bounds = rect ?? { x0: 0, x1: W, y0: 0, y1: H };
  return [clamp(Math.round(x * s + offX), bounds.x0, bounds.x1), clamp(Math.round(y * s + offY), bounds.y0, bounds.y1)];
}

// Strict routing boxes — a future American Samoa (-14.3, -170.7) matches none.
export function regionOf(lat, lon) {
  if (lat >= 51 && lat <= 72 && (lon <= -129 || lon >= 172)) return "AK";
  if (lat >= 18 && lat <= 23 && lon >= -161 && lon <= -154) return "HI";
  if (lat >= 17.5 && lat <= 18.8 && lon >= -68 && lon <= -64.4) return "PR";
  if (lat >= 13 && lat <= 21 && lon >= 144 && lon <= 147) return "GU";
  if (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66) return "CONUS";
  return null;
}

const conusInset = { params: CONUS, s: SCALE, offX: cOffX, offY: cOffY };
const INSETS = { CONUS: conusInset, AK: akInset, HI: hiInset, GU: guInset, PR: prInset };

// Placed rectangles of the insets in canvas space (for the no-overlap test).
export const INSET_RECTS = { AK: akInset.rect, HI: hiInset.rect, GU: guInset.rect, PR: prInset.rect };

// Pure — [x, y] integers in canvas space, or null when outside every region.
export function projectPoint(lat, lon) {
  const region = regionOf(lat, lon);
  return region ? place(lat, lon, INSETS[region]) : null;
}

// Pure — index into STATUSES, or -1 when unknown.
export function mapStatus(status) {
  return typeof status === "string" ? STATUSES.indexOf(status) : -1;
}

const isValidEntry = (e) =>
  e !== null &&
  typeof e === "object" &&
  Number.isFinite(e.lat) && e.lat >= -90 && e.lat <= 90 &&
  Number.isFinite(e.lon) && e.lon >= -180 && e.lon <= 180 &&
  mapStatus(e.status) !== -1;

// Pure — true when the raw feed is safe to publish. prevCount guards against a
// truncated/partial feed wiping the hero.
export function isValidRaw(raw, prevCount = 0) {
  if (!Array.isArray(raw) || raw.length === 0) return false;
  const valid = raw.filter(isValidEntry).length;
  if (valid / raw.length < 0.9) return false;
  if (Number.isInteger(prevCount) && prevCount > 0 && valid < prevCount * 0.5) return false;
  return true;
}

// Pure — compact payload. `dropped` counts invalid entries plus those outside every region.
export function buildPayload(raw, { asOf }) {
  const pts = [];
  let dropped = 0;
  for (const e of raw) {
    const p = isValidEntry(e) ? projectPoint(e.lat, e.lon) : null;
    if (!p) {
      dropped++;
      continue;
    }
    pts.push(p[0], p[1], mapStatus(e.status));
  }
  return { asOf, source: SOURCE_URL, count: pts.length / 3, dropped, w: W, h: H, statuses: STATUSES, pts };
}

// Pure — anti-churn: rewrite only when the data (not asOf) changed.
export function shouldWrite(prev, next) {
  if (!prev || typeof prev !== "object") return true;
  return !(
    prev.count === next.count &&
    prev.dropped === next.dropped &&
    prev.w === next.w &&
    prev.h === next.h &&
    Array.isArray(prev.pts) &&
    prev.pts.length === next.pts.length &&
    prev.pts.every((v, i) => v === next.pts[i])
  );
}

// Pure — appends a unique `t` query param so a stale CDN cache entry for the bare
// URL cannot serve an old copy of the feed. Works with or without an existing query.
export function withCacheBust(url, now = Date.now()) {
  const u = new URL(url);
  u.searchParams.set("t", String(now));
  return u.toString();
}

// Pure — a built payload is publishable only when few entries fell outside every
// routing box (guards a feed that drifted to other coordinates).
export function isValidPayload(payload) {
  return payload.count > 0 && payload.dropped <= 0.1 * payload.count;
}

async function main() {
  let prev = null;
  try {
    prev = JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    console.warn("[sync-atlas-points] no existing public/atlas-points.json");
  }

  const raw = await fetchJson(withCacheBust(process.env.ATLAS_POINTS_URL || SOURCE_URL), {
    headers: { "User-Agent": "sync-atlas-points" },
  });
  if (!raw) {
    console.warn("[sync-atlas-points] feed unreachable — keeping existing file");
    return;
  }
  if (!isValidRaw(raw, prev?.count ?? 0)) {
    console.warn("[sync-atlas-points] feed failed validation — keeping existing file");
    return;
  }

  const next = buildPayload(raw, { asOf: new Date().toISOString().slice(0, 10) });
  if (!isValidPayload(next)) {
    console.warn(`[sync-atlas-points] ${next.dropped} of ${next.count + next.dropped} entries outside every region — keeping existing file`);
    return;
  }
  if (!shouldWrite(prev, next)) {
    console.log("[sync-atlas-points] unchanged — not rewriting");
    return;
  }
  const json = JSON.stringify(next);
  const tmpPath = `${outPath}.tmp`;
  try {
    fs.writeFileSync(tmpPath, json);
    fs.renameSync(tmpPath, outPath); // atomic: never leaves a partial committed file
  } catch (err) {
    fs.rmSync(tmpPath, { force: true });
    throw err;
  }
  console.log(
    `[sync-atlas-points] wrote public/atlas-points.json · ${next.count} pts · ${next.dropped} dropped · ${json.length} B raw · ${zlib.gzipSync(json).length} B gzip`,
  );
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) {
  try {
    await main();
  } catch (err) {
    console.warn("[sync-atlas-points] unexpected error — keeping existing file:", err?.message);
  }
}
