#!/usr/bin/env node
// Generates src/data/atlasStats.js AND refreshes public/atlas-stats.json from the
// live Compute Atlas API, so the portfolio's Compute Atlas case-study numbers
// self-heal at build time instead of being hand-edited (they drifted 327→760→1231).
//
// Source priority (highest wins):
//   1. Canonical fetch — https://www.compute-atlas.com/api/stats
//      (best-effort; makes `npm run sync-atlas` self-refresh locally).
//   2. Existing public/atlas-stats.json (the committed snapshot locally).
//   3. Hard-coded fallback constants (offline + first run).
//
// Never fails the build on a network error — it degrades to (2) then (3).

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const statsPath = path.join(root, "public", "atlas-stats.json");
const outPath = path.join(root, "src", "data", "atlasStats.js");

const CANONICAL_URL = "https://www.compute-atlas.com/api/stats";

// Offline/first-run fallback. Bump alongside canonical when convenient.
export const FALLBACK = {
  count: 2693,
  states: 55,
  operationalMw: 61063.7,
  plannedMw: 491451.3,
  underConstructionMw: 129514.9,
  stateCodes: [
    "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "GU", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MP", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VI", "VT", "WA", "WI", "WV", "WY"
  ],
};

// VERSION is now a fallback only — the live API returns edition.version,
// which deriveAtlasStats() prefers when present. STACK/LICENSE are still
// not returned by the API, so they stay hand-bumped constants (mirrors the
// cast-desktop version default in sync-cast-stats.mjs).
const VERSION = "v1.34.1";
const STACK = "Next.js 16 · React 19 · TypeScript · MapLibre GL · Neon Postgres · Drizzle · Vercel";
const LICENSE = "MIT + CC BY 4.0";

function fetchJson(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { "User-Agent": "sync-atlas-stats" } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// Normalizes an edition version string to the site's "vX.Y.Z" format: trims
// surrounding whitespace, then ensures exactly one lowercase "v" prefix
// (matched case-insensitively, so "V1.30.0" and "v1.30.0" both normalize to
// "v1.30.0") without double-prefixing. The rest of the string is left
// untouched — a version may legitimately carry an uppercase pre-release tag
// (e.g. "1.30.0-RC1"), and lowercasing the whole string would corrupt it.
// Returns null for non-string, empty, or whitespace-only input.
function normalizeVersion(v) {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (trimmed === "") return null;
  return /^v/i.test(trimmed) ? `v${trimmed.slice(1)}` : `v${trimmed}`;
}

const US_STATES = new Set(
  (
    "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT " +
    "NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY"
  ).split(" "),
);
const TERRITORIES = new Set(["AS", "GU", "MP", "PR", "VI", "UM"]);

// The API's `states` is a jurisdiction count (50 states + DC + territories), so
// "N states" is only true when derived from stateCodes. Without stateCodes we
// take the conservative path (no state count, jurisdiction wording).
function conservativeCoverage(raw) {
  return {
    states: null,
    hasDc: false,
    territories: 0,
    jurisdictions: raw.states,
    coverage: `${raw.states} U.S. jurisdictions`,
  };
}

function deriveCoverage(raw) {
  // Only trust stateCodes when it agrees with the reported count; the
  // fallback < base < canonical merge can pair stale codes with a newer count.
  if (!Array.isArray(raw.stateCodes) || raw.stateCodes.length !== raw.states) {
    return conservativeCoverage(raw);
  }
  const codes = raw.stateCodes;
  const states = codes.filter((c) => US_STATES.has(c)).length;
  const hasDc = codes.includes("DC");
  const territories = codes.filter((c) => TERRITORIES.has(c)).length;
  const parts = [];
  if (states > 0) parts.push(`${states} states`);
  if (hasDc) parts.push("DC");
  if (territories > 0) parts.push(`${territories} ${territories === 1 ? "territory" : "territories"}`);
  if (parts.length === 0) return conservativeCoverage(raw);
  const coverage =
    parts.length <= 1 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return { states, hasDc, territories, jurisdictions: codes.length, coverage };
}

const isNonNegNumber = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0;

// Pure — true when a raw stats object is safe to derive from. Whole-source
// validation (rather than per-key merging) keeps stale stateCodes from pairing
// with a newer count.
export function isValidRaw(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return false;
  if (!Number.isInteger(raw.count) || raw.count <= 0) return false;
  if (!Number.isInteger(raw.states) || raw.states <= 0) return false;
  if (!["operationalMw", "plannedMw", "underConstructionMw"].every((k) => isNonNegNumber(raw[k]))) {
    return false;
  }
  if (raw.stateCodes !== undefined) {
    if (!Array.isArray(raw.stateCodes)) return false;
    const codes = raw.stateCodes;
    if (codes.length !== raw.states) return false;
    if (!codes.every((c) => typeof c === "string" && (US_STATES.has(c) || c === "DC" || TERRITORIES.has(c)))) {
      return false;
    }
    if (new Set(codes).size !== codes.length) return false;
  }
  return true;
}

// Pure — the first of canonical, base, fallback that passes isValidRaw.
// Returns { source, raw }; fallback is the last resort and always wins by default.
export function selectSource(canonical, base, fallback) {
  if (isValidRaw(canonical)) return { source: "canonical", raw: canonical };
  if (isValidRaw(base)) return { source: "base", raw: base };
  return { source: "fallback", raw: fallback };
}

// Pure — derives the curated bundle baked into src/data/atlasStats.js from the
// raw API shape (count/states/*Mw[/edition.version]). No side effects; safe to
// import for tests.
export function deriveAtlasStats(raw) {
  return {
    facilities: raw.count,
    ...deriveCoverage(raw),
    operationalMw: Math.round(raw.operationalMw),
    operationalGw: round1(raw.operationalMw / 1000),
    underConstructionMw: Math.round(raw.underConstructionMw),
    underConstructionGw: round1(raw.underConstructionMw / 1000),
    plannedMw: Math.round(raw.plannedMw),
    plannedGw: round1(raw.plannedMw / 1000),
    version: normalizeVersion(raw.edition?.version) ?? VERSION,
    stack: STACK,
    license: LICENSE,
  };
}

async function main() {
  // 1. Base — committed public/atlas-stats.json (may be missing).
  let base = {};
  try {
    base = JSON.parse(fs.readFileSync(statsPath, "utf8"));
  } catch {
    console.warn("[sync-atlas-stats] public/atlas-stats.json not found — using fallback constants");
  }

  // 2. Canonical — authoritative, best-effort.
  const canonical = await fetchJson(CANONICAL_URL);
  // 3. Select one whole valid source (canonical > base > fallback).
  const { source, raw: merged } = selectSource(canonical, base, FALLBACK);
  if (canonical && source !== "canonical") {
    console.warn("[sync-atlas-stats] canonical fetched but failed validation — rejected");
  } else if (!canonical) {
    console.warn("[sync-atlas-stats] canonical unreachable");
  }
  console.log("[sync-atlas-stats] using source:", source, "· count", merged.count, "· states", merged.states);

  // Refresh the runtime file so dev + the committed snapshot track canonical.
  fs.writeFileSync(statsPath, JSON.stringify(merged, null, 2) + "\n");

  const atlas = deriveAtlasStats(merged);

  // No volatile timestamp in the banner — keeps the generated file churn-free
  // when the stats themselves are unchanged (see portfolio build notes).
  const banner = `// AUTO-GENERATED by scripts/sync-atlas-stats.mjs — do not edit manually.
// Source: canonical compute-atlas.com/api/stats (best-effort fetch) →
//         public/atlas-stats.json → fallback.
// Refresh: run \`npm run sync-atlas\` or any \`npm run build\` (prebuild hook).
`;

  const body = `
export const ATLAS_STATS = ${JSON.stringify(atlas, null, 2)};
`;

  fs.writeFileSync(outPath, banner + body);
  console.log("[sync-atlas-stats] Wrote", path.relative(root, outPath), "+ refreshed public/atlas-stats.json");
  console.log("  ATLAS:", atlas);
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) await main();
