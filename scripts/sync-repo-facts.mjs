#!/usr/bin/env node
// Generates src/data/repoFacts.js AND refreshes public/repo-facts.json from the
// public Compute Atlas repo, so the case-study numbers in src/data/projects.js
// (route handlers, test files, workflows, commits, Claude co-authored commits)
// self-heal instead of being hand-edited.
//
// Two independent groups, each all-or-nothing (a partial count is never published):
//   tree    — routeHandlers, testFiles, workflows  (git tree, one request)
//   commits — commits, claudeCoauthored            (paginated commit list)
//
// Source priority per group (highest wins):
//   1. Live GitHub API — best-effort.
//   2. Existing public/repo-facts.json (the committed snapshot).
//   3. Hard-coded FALLBACK constants (offline + first run).
//
// A live group is also rejected when it looks implausible against the snapshot
// (commits shrank, or a tree count fell by more than half) or is empty.
//
// Never fails the build on a network or IO error. treeAsOf / commitsAsOf record when
// each group was actually measured, and are kept from the snapshot on fallback.

import fs from "node:fs";
import path from "node:path";
import { isDirectInvocation } from "./lib/direct-invocation.mjs";

import { fetchJson } from "./lib/fetch-json.mjs";
import { githubHeaders } from "./lib/github.mjs";
import { writeAtomic } from "./lib/write-atomic.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultSnapshotPath = path.join(root, "public", "repo-facts.json");
const defaultOutPath = path.join(root, "src", "data", "repoFacts.js");

const API_BASE = "https://api.github.com";
const REPO = "ek33450505/compute-atlas";
const PAGE_SIZE = 100;
const MAX_PAGES = 30;

// Each group is one unit: its counts and its as-of date are published, replaced and
// dropped together, never mixed across measurements.
const GROUPS = {
  tree: { counts: ["routeHandlers", "testFiles", "workflows"], date: "treeAsOf" },
  commits: { counts: ["commits", "claudeCoauthored"], date: "commitsAsOf" },
};

// Offline/first-run fallback + snapshot seed (verified 2026-10-19).
export const FALLBACK = {
  routeHandlers: 20,
  testFiles: 335,
  workflows: 9,
  commits: 645,
  claudeCoauthored: 494,
  treeAsOf: "2026-10-19",
  commitsAsOf: "2026-10-19",
};

const ROUTE_RE = /(^|\/)app\/api\/.+\/route\.(ts|tsx|js)$/;
const TEST_RE = /\.test\.(ts|tsx|js|jsx|mjs)$/;
const WORKFLOW_RE = /^\.github\/workflows\/[^/]+\.ya?ml$/;
const CLAUDE_TRAILER_RE = /^co-authored-by:.*(claude|anthropic)/im;

// Pure — counts blobs in a git-tree response. Returns null for a malformed or
// truncated tree (the counts would be partial).
export function countTree(tree) {
  if (!tree || tree.truncated !== false || !Array.isArray(tree.tree)) return null;
  const paths = tree.tree.filter((e) => e && e.type === "blob" && typeof e.path === "string").map((e) => e.path);
  if (paths.length === 0) return null; // an empty tree is not a measurement
  const inNodeModules = (p) => /(^|\/)node_modules\//.test(p);
  return {
    routeHandlers: paths.filter((p) => ROUTE_RE.test(p) && !inNodeModules(p)).length,
    testFiles: paths.filter((p) => TEST_RE.test(p) && !inNodeModules(p)).length,
    workflows: paths.filter((p) => WORKFLOW_RE.test(p)).length,
  };
}

// Pure — does a commit message carry a Claude/Anthropic co-author trailer?
export function hasClaudeTrailer(message) {
  return typeof message === "string" && CLAUDE_TRAILER_RE.test(message);
}

// Walks pages until a short page. fetchPage(n) resolves an array or null.
// Any failed page, or hitting the page cap, returns null (never a partial count).
// Commits are deduped by sha across pages: a commit landing mid-pagination shifts a page
// boundary and repeats an item. An item without a 40-hex sha is not a commit object.
export async function countCommits(fetchPage, maxPages = MAX_PAGES) {
  let commits = 0;
  let claudeCoauthored = 0;
  const seen = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const items = await fetchPage(page);
    if (!Array.isArray(items)) return null;
    if (page === 1 && items.length === 0) return null; // an empty history is not a measurement
    for (const item of items) {
      if (typeof item?.commit?.message !== "string") return null; // not a commit object
      if (typeof item.sha !== "string" || !/^[0-9a-f]{40}$/.test(item.sha)) return null;
      if (seen.has(item.sha)) continue;
      seen.add(item.sha);
      commits += 1;
      if (hasClaudeTrailer(item.commit.message)) claudeCoauthored += 1;
    }
    if (items.length < PAGE_SIZE) return { commits, claudeCoauthored };
  }
  return null;
}

function fetchGithub(url) {
  return fetchJson(url, { idleMs: 4000, deadlineMs: 15000, headers: githubHeaders(url, process.env.GITHUB_TOKEN) });
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Pure — a real calendar date in YYYY-MM-DD form ("2026-02-31" fails).
export function isRealDate(value) {
  const m = typeof value === "string" ? DATE_RE.exec(value) : null;
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

// Pure — keeps a snapshot group only if the WHOLE group is valid (all counts pass
// checkFacts with no baseline, and the as-of is a real date). A group that is entirely
// absent is skipped silently; any other invalid group is dropped as a unit (the caller
// falls through to the constants for it) and reported in `warnings`.
export function validateSnapshot(raw) {
  const facts = {};
  const warnings = [];
  const src = raw && typeof raw === "object" ? raw : {};
  for (const [name, { counts, date }] of Object.entries(GROUPS)) {
    const keys = [...counts, date];
    if (!keys.some((k) => k in src)) continue;
    const group = Object.fromEntries(keys.map((k) => [k, src[k]]));
    const reasons = checkOutput(name, group, null);
    if (reasons.length === 0) Object.assign(facts, group);
    else warnings.push(`snapshot ${name} group is invalid (${reasons.join("; ")}) — ignoring the whole group`);
  }
  return { facts, warnings };
}

// Declared key spec for every published count. "monotonic": history only grows, so
// live >= snapshot. NOTE: this deliberately freezes the commits group if compute-atlas
// history is ever rewritten (squash/force-push); the exit is to hand-edit the commits
// group in public/repo-facts.json + src/data/repoFacts.js in a reviewed PR. "shrinkable": may legitimately shrink, but not below half.
const SPEC = {
  tree: { routeHandlers: "shrinkable", testFiles: "shrinkable", workflows: "shrinkable" },
  commits: { commits: "monotonic", claudeCoauthored: "monotonic" },
};

// Pure — the single validation boundary. Returns the reasons a live group must be
// rejected (empty array = accept). Every key must be an integer >= 1 (all five metrics
// are inherently positive for this repo, so a 0 is never real), obey its snapshot rule,
// and be declared in SPEC; claudeCoauthored may not exceed commits.
export function checkFacts(group, live, snapshot) {
  const spec = SPEC[group];
  if (!spec) return [`unknown group ${group}`];
  const reasons = [];
  const snap = snapshot ?? {};
  for (const [key, rule] of Object.entries(spec)) {
    const v = live?.[key];
    if (!Number.isInteger(v) || v < 1) {
      reasons.push(`${key} must be an integer >= 1 (got ${v})`);
      continue;
    }
    const s = snap[key];
    if (!Number.isInteger(s)) continue;
    if (rule === "monotonic" && v < s) reasons.push(`${key} shrank from ${s} to ${v}`);
    if (rule === "shrinkable" && v < s / 2) reasons.push(`${key} fell from ${s} to ${v}`);
  }
  for (const key of Object.keys(live ?? {})) {
    if (!(key in spec)) reasons.push(`unexpected key ${key}`);
  }
  if (group === "commits" && live?.claudeCoauthored > live?.commits) {
    reasons.push(`claudeCoauthored (${live.claudeCoauthored}) exceeds commits (${live.commits})`);
  }
  return reasons;
}

// Pure — the final-output gate for one group: checkFacts with no baseline, plus a strict
// as-of check (real calendar date, not after `today`; pass today=null to skip the future
// check). Returns reasons; empty = publishable.
export function checkOutput(group, facts, today) {
  const reasons = checkFacts(group, Object.fromEntries(GROUPS[group].counts.map((k) => [k, facts?.[k]])), null);
  const asOf = facts?.[GROUPS[group].date];
  if (!isRealDate(asOf)) reasons.push(`${GROUPS[group].date} is not a real YYYY-MM-DD date (got ${asOf})`);
  else if (today && asOf > today) reasons.push(`${GROUPS[group].date} ${asOf} is in the future`);
  return reasons;
}

export async function main({
  fetch = fetchGithub,
  snapshotPath = defaultSnapshotPath,
  outJsPath = defaultOutPath,
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  const updated = [];
  try {
    if (!isRealDate(today)) throw new Error(`invalid today "${today}"`);
    let snap = {};
    try {
      const v = validateSnapshot(JSON.parse(fs.readFileSync(snapshotPath, "utf8")).computeAtlas);
      snap = v.facts;
      for (const w of v.warnings) console.warn(`[sync-repo-facts] ${w}`);
    } catch {
      console.warn("[sync-repo-facts] snapshot not found or unreadable — using fallback constants");
    }

    let tree = countTree(await fetch(`${API_BASE}/repos/${REPO}/git/trees/main?recursive=1`));
    let commits = await countCommits((n) =>
      fetch(`${API_BASE}/repos/${REPO}/commits?sha=main&per_page=${PAGE_SIZE}&page=${n}`)
    );

    for (const [name, live] of [["tree", tree], ["commits", commits]]) {
      if (!live) continue;
      const reasons = checkFacts(name, live, snap);
      if (reasons.length === 0) continue;
      console.warn(`[sync-repo-facts] live ${name} counts rejected (${reasons.join("; ")})`);
      if (name === "tree") tree = null;
      else commits = null;
    }

    const live = { tree, commits };
    const facts = {};
    for (const [name, { counts, date }] of Object.entries(GROUPS)) {
      const keys = [...counts, date];
      let group = live[name]
        ? { ...live[name], [date]: today }
        : Object.fromEntries(keys.map((k) => [k, k in snap ? snap[k] : FALLBACK[k]]));
      // Final-output gate: nothing reaches the written files without passing it.
      const reasons = checkOutput(name, group, today);
      if (reasons.length) {
        console.warn(`[sync-repo-facts] ${name} output rejected (${reasons.join("; ")}) — using fallback constants`);
        group = Object.fromEntries(keys.map((k) => [k, FALLBACK[k]]));
      }
      if (!live[name] || reasons.length) {
        // GitHub annotation lines are plain stdout, so they are harmless locally.
        console.warn(`::warning title=sync-repo-facts::${name} fell back; serving values as of ${group[date]}`);
      }
      Object.assign(facts, group);
    }
    const ordered = Object.fromEntries(
      [...GROUPS.tree.counts, ...GROUPS.commits.counts, GROUPS.tree.date, GROUPS.commits.date].map((k) => [k, facts[k]])
    );
    const json = JSON.stringify({ computeAtlas: ordered }, null, 2);

    const banner = `// AUTO-GENERATED by scripts/sync-repo-facts.mjs — do not edit manually.
// Source: live GitHub API for ${REPO} (best-effort fetch) →
//         public/repo-facts.json → fallback.
// Refresh: run \`npm run sync-facts\` or any \`npm run build\` (prebuild hook).
`;
    // The JS module is what the build consumes, so it lands first; the snapshot follows.
    writeAtomic(outJsPath, banner + `\nexport const REPO_FACTS = ${json};\n`);
    updated.push(path.relative(root, outJsPath));
    writeAtomic(snapshotPath, json + "\n");
    updated.push(path.relative(root, snapshotPath));
    console.log("[sync-repo-facts] Wrote", path.relative(root, outJsPath), "+ refreshed", path.relative(root, snapshotPath));
    console.log("  REPO_FACTS.computeAtlas:", ordered);
    return ordered;
  } catch (err) {
    // prebuild must never fail the deploy over this feed.
    console.warn(`[sync-repo-facts] failed (${err?.message ?? err}) — ${updated.length ? `updated before failure: ${updated.join(", ")}` : "no files were updated"}`);
    return null;
  }
}

if (isDirectInvocation(process.argv[1], import.meta.url)) await main();
