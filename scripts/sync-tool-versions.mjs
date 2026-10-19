#!/usr/bin/env node
// Generates src/data/toolStats.js AND refreshes public/tool-versions.json from
// live GitHub releases/tags for each ecosystem-tool repo, so the portfolio's
// version tags self-heal at build time instead of being hand-edited (they
// drifted — attest showed v0.2.0 in one place, v0.3.0 in another).
//
// Source priority (highest wins):
//   1. Live GitHub API (releases/latest, falling back to tags) — best-effort.
//   2. Existing public/tool-versions.json (the committed snapshot locally).
//   3. Hard-coded FALLBACK constants (offline + first run).
//
// Never fails the build on a network error — it degrades to (2) then (3).

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { fetchJson } from "./lib/fetch-json.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const versionsPath = path.join(root, "public", "tool-versions.json");
const outPath = path.join(root, "src", "data", "toolStats.js");

const OWNER = "ek33450505";

// TOOL_VERSIONS_API_BASE overrides the GitHub API origin (used by the truncated-body test).
const API_BASE = process.env.TOOL_VERSIONS_API_BASE || "https://api.github.com";

// Portfolio slug -> GitHub repo name.
const REPOS = {
  attest: "attest",
  misfire: "misfire",
  looptrip: "looptrip",
  "cast-mcp": "cast-mcp",
  "cast-ledger": "cast-ledger",
  "cast-predict": "cast-predict",
  "cast-time": "cast-time",
  "cast-doctor": "cast-doctor",
  "cast-memory": "cast-memory",
  "claudes-journal": "cast-claudes_journal",
  "claude-code-dashboard": "claude-code-dashboard",
};

// Offline/first-run fallback + snapshot seed. Bump alongside canonical when convenient.
const FALLBACK = {
  attest: "v0.3.0",
  misfire: "v0.2.0",
  looptrip: "v0.1.2",
  "cast-mcp": "v0.1.0",
  "cast-ledger": "v0.2.0",
  "cast-predict": "v0.1.1",
  "cast-time": "v0.2.0",
  "cast-doctor": "v0.1.3",
  "cast-memory": "v0.4.1",
  "claudes-journal": "v0.4.2",
  "claude-code-dashboard": "v3.0.0",
};

// Pure, testable — filters to semver-ish tag names (optionally "v"-prefixed)
// and returns the numerically-highest, normalized to a "v" prefix. GitHub's
// /tags array is NOT semver-sorted, so callers must not trust its order.
// Returns null for empty/no-match input.
export function pickLatestSemver(tagNames) {
  const parsed = (tagNames || [])
    .map((name) => {
      const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(name);
      if (!match) return null;
      return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
      };
    })
    .filter(Boolean);

  if (parsed.length === 0) return null;

  parsed.sort((a, b) => b.major - a.major || b.minor - a.minor || b.patch - a.patch);

  const top = parsed[0];
  return `v${top.major}.${top.minor}.${top.patch}`;
}

// Pure — the token is sent only to the real GitHub API origin, never to an
// env-overridden TOOL_VERSIONS_API_BASE (which may be plain http or a foreign host).
export function githubHeaders(url, token) {
  const headers = {
    "User-Agent": "sync-tool-versions",
    Accept: "application/vnd.github+json",
  };
  let origin = null;
  try {
    origin = new URL(url).origin;
  } catch { /* invalid URL: no token */ }
  if (token && origin === "https://api.github.com") {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function fetchGithub(url) {
  return fetchJson(url, { idleMs: 4000, deadlineMs: 15000, headers: githubHeaders(url, process.env.GITHUB_TOKEN) });
}

// Best-effort per-repo resolution — never throws. Tries releases/latest
// first, falls back to /tags, then null (caller falls back to snapshot/FALLBACK).
async function resolveVersion(repo) {
  const latest = await fetchGithub(`${API_BASE}/repos/${OWNER}/${repo}/releases/latest`);
  if (latest && typeof latest.tag_name === "string") {
    const normalized = pickLatestSemver([latest.tag_name]);
    if (normalized) return normalized;
  }

  const tags = await fetchGithub(`${API_BASE}/repos/${OWNER}/${repo}/tags`);
  if (Array.isArray(tags)) {
    const names = tags.map((t) => t && t.name).filter(Boolean);
    const picked = pickLatestSemver(names);
    if (picked) return picked;
  }

  return null;
}

async function main() {
  // 1. Base — committed public/tool-versions.json (may be missing).
  let base = {};
  try {
    base = JSON.parse(fs.readFileSync(versionsPath, "utf8"));
  } catch {
    console.warn("[sync-tool-versions] public/tool-versions.json not found — using fallback constants");
  }

  // 2. Live — authoritative, best-effort, resolved concurrently per repo.
  const entries = await Promise.all(
    Object.entries(REPOS).map(async ([slug, repo]) => [slug, await resolveVersion(repo)])
  );
  const resolved = Object.fromEntries(entries.filter(([, version]) => version !== null));

  const resolvedCount = Object.keys(resolved).length;
  const totalCount = Object.keys(REPOS).length;
  if (resolvedCount > 0) {
    console.log(`[sync-tool-versions] resolved ${resolvedCount}/${totalCount} live versions`);
  } else {
    console.warn("[sync-tool-versions] no live versions resolved — using snapshot/fallback");
  }

  // 3. Merge (fallback < base < resolved).
  const merged = { ...FALLBACK, ...base, ...resolved };

  // Refresh the runtime file so dev + the committed snapshot track live.
  fs.writeFileSync(versionsPath, JSON.stringify(merged, null, 2) + "\n");

  // No volatile timestamp in the banner — keeps the generated file churn-free
  // when the versions themselves are unchanged (see portfolio build notes).
  const banner = `// AUTO-GENERATED by scripts/sync-tool-versions.mjs — do not edit manually.
// Source: live GitHub releases/tags (best-effort fetch) →
//         public/tool-versions.json → fallback.
// Refresh: run \`npm run sync-versions\` or any \`npm run build\` (prebuild hook).
`;

  const body = `
export const TOOL_VERSIONS = ${JSON.stringify(merged, null, 2)};
`;

  fs.writeFileSync(outPath, banner + body);
  console.log("[sync-tool-versions] Wrote", path.relative(root, outPath), "+ refreshed public/tool-versions.json");
  console.log("  TOOL_VERSIONS:", merged);
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) await main();
