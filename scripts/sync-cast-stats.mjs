#!/usr/bin/env node
// Generates src/data/castStats.js AND refreshes public/cast-stats.json from the
// canonical flagship stats, so both the build-time prose bake-in (Home/About/
// Resume/FeaturedWork) and the runtime-fetched CastStats component stay current.
//
// Source priority (highest wins):
//   1. Canonical fetch — https://raw.githubusercontent.com/ek33450505/claude-agent-team/main/cast-stats.json
//      (best-effort; what deploy.yml trusts). Makes `npm run sync-stats` self-refresh locally.
//   2. Existing public/cast-stats.json (deploy.yml writes this pre-build in CI; the
//      committed snapshot locally). Extra fields here are preserved.
//   3. Hard-coded fallback constants (offline + first run).
//
// Never fails the build on a network error — it degrades to (2) then (3).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { fetchJson } from "./lib/fetch-json.mjs";
import { parseDataModule } from "./lib/data-module.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const statsPath = path.join(root, "public", "cast-stats.json");
const outPath = path.join(root, "src", "data", "castStats.js");

// CAST_STATS_URL overrides the source (used by the truncated-body test).
const CANONICAL_URL =
  process.env.CAST_STATS_URL ||
  "https://raw.githubusercontent.com/ek33450505/claude-agent-team/main/cast-stats.json";

// Offline/first-run fallback. Bump alongside canonical when convenient.
const FALLBACK = {
  version: "v10.6.1",
  agents: 27,
  tests: 4767,
  packages: 9,
  commands: 21,
  skills: 19,
  tables: 46,
  updated: "2026-10-15",
};

// Fields baked into the JS bundle (curated — keeps castStats.js clean).
const CORE_FIELDS = ["version", "agents", "tests", "packages", "commands", "skills", "tables", "updated"];

// 1. Base — committed / deploy-written public/cast-stats.json (may be missing).
let base = {};
try {
  base = JSON.parse(fs.readFileSync(statsPath, "utf8"));
} catch {
  console.warn("[sync-cast-stats] public/cast-stats.json not found — using fallback constants");
}

// 2. Canonical — authoritative, best-effort. Normalise the version v-prefix
//    (canonical publishes bare semver, the app expects "v9.2.0").
const canonical = await fetchJson(CANONICAL_URL, {
  idleMs: 4000,
  deadlineMs: 15000,
  headers: { "User-Agent": "sync-cast-stats" },
});
if (canonical) {
  if (canonical.version && !String(canonical.version).startsWith("v")) {
    canonical.version = `v${canonical.version}`;
  }
  console.log("[sync-cast-stats] pulled canonical:", canonical.version, "· tests", canonical.tests);
} else {
  console.warn("[sync-cast-stats] canonical unreachable — using existing public/cast-stats.json");
}

// 3. Merge (fallback < base < canonical). Preserve any extra base/canonical fields
//    (test_files, verified_at, _source, …) so the deploy-written runtime file is
//    never stripped — nothing consumes them, but keeping them is harmless & stable.
const merged = { ...FALLBACK, ...base, ...(canonical || {}) };

// Refresh the runtime file so dev + the committed snapshot track canonical.
fs.writeFileSync(statsPath, JSON.stringify(merged, null, 2) + "\n");

// Curated core for the JS bundle.
const cast = {};
for (const k of CORE_FIELDS) cast[k] = merged[k];

// cast-desktop stats — seeded from the last-COMMITTED src/data/castStats.js (read before it is
// rewritten below) so a runner without the clone does not roll the version back; a local clone
// overrides when present. Hard-coded constants are the last resort.
let desktop = {
  version: "v1.2.12",
  dashboardViews: 11,
};
try {
  const committed = parseDataModule(fs.readFileSync(outPath, "utf8")).exports.find(
    (e) => e.name === "CAST_DESKTOP_STATS",
  )?.value;
  if (
    committed &&
    typeof committed.version === "string" &&
    /^v\d+\.\d+\.\d+(-[\w.]+)?$/.test(committed.version) &&
    Number.isInteger(committed.dashboardViews) &&
    committed.dashboardViews >= 0
  ) {
    desktop = { version: committed.version, dashboardViews: committed.dashboardViews };
  } else {
    console.warn("[sync-cast-stats] committed CAST_DESKTOP_STATS failed the shape check — using hard-coded constants");
  }
} catch (err) {
  console.warn(`[sync-cast-stats] could not read committed desktop stats (${err.message}) — using hard-coded constants`);
}
const desktopRepo = path.join(os.homedir(), "Projects", "personal", "cast-desktop");
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(desktopRepo, "package.json"), "utf8"));
  desktop.version = `v${pkg.version}`;
} catch { /* keep default */ }
try {
  const views = fs
    .readdirSync(path.join(desktopRepo, "src", "dashboard", "views"))
    .filter((f) => f.endsWith(".tsx") && !f.includes(".test."));
  desktop.dashboardViews = views.length;
} catch { /* keep default */ }

// Ecosystem-level rollups (derived).
const ecosystem = {
  taps: cast.packages,
  tapsPlusUmbrella: `${cast.packages} Homebrew taps plus the umbrella \`cast\` formula`,
  marketingDomain: "castframework.dev",
};

// No volatile timestamp in the banner — keeps the generated file churn-free when
// the stats themselves are unchanged (see portfolio build notes).
const banner = `// AUTO-GENERATED by scripts/sync-cast-stats.mjs — do not edit manually.
// Source: canonical claude-agent-team/cast-stats.json (best-effort fetch) →
//         public/cast-stats.json → fallback. Desktop: ~/Projects/personal/cast-desktop.
// Refresh: run \`npm run sync-stats\` or any \`npm run build\` (prebuild hook).
`;

const body = `
export const CAST_STATS = ${JSON.stringify(cast, null, 2)};

export const CAST_DESKTOP_STATS = ${JSON.stringify(desktop, null, 2)};

export const CAST_ECOSYSTEM = ${JSON.stringify(ecosystem, null, 2)};
`;

fs.writeFileSync(outPath, banner + body);
console.log("[sync-cast-stats] Wrote", path.relative(root, outPath), "+ refreshed public/cast-stats.json");
console.log("  CAST:", cast);
console.log("  Desktop:", desktop);
