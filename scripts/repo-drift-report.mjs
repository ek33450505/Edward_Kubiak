#!/usr/bin/env node
// Weekly "drift report": markdown telling Ed what changed across his public repos that
// the site may need to reflect. It is a REPORT, never a gate and never an editor — site
// prose stays Ed-approved. Always exits 0; a failed API call makes that section say
// "unavailable (GitHub API error)" rather than make a wrong claim.
//
//   A. new public repos not on the site     C. releases in the last 7 days
//   B. site repos that changed state        D. stale literal "as of" anchors (> 60 days)
//
// Run: GITHUB_TOKEN=$(gh auth token) npm run drift-report   (add --json for JSON)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectInvocation } from "./lib/direct-invocation.mjs";

import { fetchJson } from "./lib/fetch-json.mjs";
import { githubHeaders } from "./lib/github.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const API_BASE = "https://api.github.com";
const OWNER = "ek33450505";
const MAX_CALLS = 60;
const NEW_REPO_DAYS = 30;
const RELEASE_DAYS = 7;
const STALE_DAYS = 60;
const MAX_PAGES = 3;
const DAY_MS = 86_400_000;

const UNAVAILABLE = "unavailable (GitHub API error)";

// Resolves { status, body }; null only on transport failure (callers treat it as
// unavailable). 404 stays distinguishable because it means "gone" / "no releases".
export function fetchGithub(url, token = process.env.GITHUB_TOKEN) {
  return fetchJson(url, { headers: githubHeaders(url, token), withStatus: true });
}

// ---- Section D: literal "as of" anchors -------------------------------------------

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_ALT = [...MONTHS, ...MONTHS.map((m) => m.slice(0, 3))]
  .sort((a, b) => b.length - a.length)
  .join("|");
const INTERP = "\\$\\{[^}]*\\}";
const mon = `(?:${MONTH_ALT})\\.?|${INTERP}`;
const day = `\\d{1,2}|${INTERP}`;
const year = `\\d{4}|${INTERP}`;

const ANCHOR_RES = [
  // as of August 30, 2026
  { kind: "mdy", re: new RegExp(`\\bas of (${mon})\\s+(${day}),?\\s+(${year})`, "gi") },
  // as of August 2026 (the last day of that month)
  { kind: "my", re: new RegExp(`\\bas of (${mon})\\s+(${year})(?!\\d)`, "gi") },
  // as of 2026-08-30
  { kind: "iso", re: new RegExp(`\\bas of (${year})-(\\d{2}|${INTERP})-(\\d{2}|${INTERP})`, "gi") },
];

function monthIndex(name) {
  const k = name.toLowerCase().replace(/\.$/, "").slice(0, 3);
  return MONTHS.findIndex((m) => m.startsWith(k));
}

function anchorDate(kind, g) {
  let y, m, d;
  if (kind === "mdy") {
    m = monthIndex(g[1]);
    d = Number(g[2]);
    y = Number(g[3]);
  } else if (kind === "my") {
    m = monthIndex(g[1]);
    y = Number(g[2]);
    d = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  } else {
    y = Number(g[1]);
    m = Number(g[2]) - 1;
    d = Number(g[3]);
  }
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  const t = new Date(Date.UTC(y, m, d));
  // Reject overflow like "February 31".
  return t.getUTCMonth() === m && t.getUTCDate() === d ? t : null;
}

function utcMidnight(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function scanText(text, file, today) {
  const hits = [];
  text.split("\n").forEach((line, i) => {
    for (const { kind, re } of ANCHOR_RES) {
      re.lastIndex = 0;
      for (const m of line.matchAll(re)) {
        // Interpolated parts (${...}) never parse to a date, so fed anchors drop out here.
        const date = anchorDate(kind, m);
        if (!date) continue;
        hits.push({
          file,
          line: i + 1,
          text: m[0],
          date: date.toISOString().slice(0, 10),
          ageDays: Math.floor((utcMidnight(today) - date.getTime()) / DAY_MS),
        });
      }
    }
  });
  return hits;
}

function walk(dir, accept) {
  const out = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, accept));
    else if (accept(e.name)) out.push(p);
  }
  return out;
}

export function scanAnchors(rootDir, today) {
  const notTest = (n) => !/\.test\./.test(n);
  const files = [
    ...walk(path.join(rootDir, "src/data"), (n) => n.endsWith(".js") && notTest(n)).filter(
      (p) => path.dirname(p) === path.join(rootDir, "src/data"),
    ),
    path.join(rootDir, "scripts/build-resume-pdf.mjs"),
    ...walk(path.join(rootDir, "src/Components"), (n) => n.endsWith(".jsx") && notTest(n)),
  ].sort();
  const hits = [];
  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    hits.push(...scanText(text, path.relative(rootDir, f), today));
  }
  return hits.filter((h) => h.ageDays > STALE_DAYS);
}

// ---- Sections A-C -----------------------------------------------------------------

function repoNameFromUrl(url) {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/i.exec(url || "");
  return m ? { owner: m[1], name: m[2] } : null;
}

// Counts every API call; once the cap is hit further calls resolve null so sections
// degrade to "unavailable" and the report says why.
function makeClient(fetch) {
  const state = { calls: 0, exhausted: false };
  async function get(url) {
    if (state.calls >= MAX_CALLS) {
      state.exhausted = true;
      return null;
    }
    state.calls += 1;
    try {
      const r = await fetch(url);
      return r && typeof r.status === "number" ? r : { status: 0, body: null };
    } catch {
      return { status: 0, body: null };
    }
  }
  return { get, state };
}

async function sectionA(client, siteRepos, today) {
  const cutoff = utcMidnight(today) - NEW_REPO_DAYS * DAY_MS;
  const items = [];
  let note = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await client.get(
      `${API_BASE}/users/${OWNER}/repos?type=owner&sort=created&direction=desc&per_page=100&page=${page}`,
    );
    if (!r || r.status !== 200 || !Array.isArray(r.body)) return { error: true };
    let reachedOld = false;
    for (const repo of r.body) {
      const created = Date.parse(repo.created_at);
      if (!(created >= cutoff)) {
        reachedOld = true;
        continue;
      }
      if (repo.fork || repo.archived || repo.private === true) continue;
      if (/^homebrew-/i.test(repo.name)) continue;
      if (siteRepos.has(repo.name.toLowerCase())) continue;
      items.push({ name: repo.name, created: String(repo.created_at).slice(0, 10), url: repo.html_url });
    }
    if (reachedOld || r.body.length < 100) break;
    if (page === MAX_PAGES) note = "list may be incomplete: page cap reached";
  }
  return { items, note };
}

async function sectionB(client, siteRepoNames) {
  const items = [];
  let failed = 0;
  for (const name of siteRepoNames) {
    const r = await client.get(`${API_BASE}/repos/${OWNER}/${name}`);
    if (!r || r.status === 0) {
      failed += 1;
      continue;
    }
    if (r.status === 404) {
      items.push({ name, state: "not found (deleted, private, or unreachable)" });
      continue;
    }
    // The REST API answers a renamed/transferred repo with a 301, and fetchJson does
    // not follow redirects.
    if (r.status === 301) {
      items.push({ name, state: "moved (renamed or transferred) \u2014 check the repo" });
      continue;
    }
    if (r.status !== 200) {
      failed += 1;
      continue;
    }
    const full = r.body?.full_name;
    if (r.body?.private === true) {
      items.push({ name, state: "now private" });
    } else if (typeof full === "string" && full.toLowerCase() !== `${OWNER}/${name}`.toLowerCase()) {
      items.push({ name, state: `renamed to ${full}` });
    } else if (r.body?.archived === true) {
      items.push({ name, state: "archived" });
    }
  }
  return failed ? { error: true, items } : { items };
}

async function sectionC(client, repoNames, toolVersions, today) {
  const cutoff = utcMidnight(today) - RELEASE_DAYS * DAY_MS;
  const items = [];
  let failed = 0;
  for (const name of repoNames) {
    const r = await client.get(`${API_BASE}/repos/${OWNER}/${name}/releases/latest`);
    if (!r || r.status === 0 || (r.status !== 200 && r.status !== 404)) {
      failed += 1;
      continue;
    }
    if (r.status === 404) continue; // no releases is not an error
    const tag = r.body?.tag_name;
    const published = Date.parse(r.body?.published_at);
    if (!tag || !(published >= cutoff)) continue;
    items.push({
      name,
      tag,
      published: new Date(published).toISOString().slice(0, 10),
      inToolVersions: toolVersions[name] === tag,
    });
  }
  return failed ? { error: true, items } : { items };
}

// ---- Render -----------------------------------------------------------------------

function renderSection(title, result, line) {
  const out = [`## ${title}`, ""];
  if (result.error) {
    out.push(`- ${UNAVAILABLE}`);
    for (const it of result.items ?? []) out.push(`- ${line(it)}`);
    return out.join("\n");
  }
  out.push(`Count: ${result.items.length}`, "");
  if (!result.items.length) out.push("Nothing to report.");
  else for (const it of result.items) out.push(`- ${line(it)}`);
  if (result.note) out.push("", `Note: ${result.note}`);
  return out.join("\n");
}

export function renderMarkdown(r, today) {
  const parts = [
    `# Repo drift report - ${today.toISOString().slice(0, 10)}`,
    "",
    "Report only: nothing here has been applied to the site.",
    "",
    renderSection("A. New public repos not on the site", r.newRepos, (i) => `${i.name} (created ${i.created}) ${i.url}`),
    "",
    renderSection("B. Site repos that changed state", r.stateChanges, (i) => `${i.name}: ${i.state}`),
    "",
    renderSection(
      `C. Releases in the last ${RELEASE_DAYS} days`,
      r.releases,
      (i) => `${i.name} ${i.tag} (${i.published}) - ${i.inToolVersions ? "already in TOOL_VERSIONS" : "not yet in TOOL_VERSIONS (refreshes at build)"}`,
    ),
    "",
    renderSection(
      `D. Stale "as of" anchors (> ${STALE_DAYS} days)`,
      { items: r.staleAnchors },
      (i) => `${i.file}:${i.line} "${i.text}" - ${i.ageDays} days old`,
    ),
  ];
  if (r.budget.exhausted) {
    parts.push("", `Note: API budget exhausted (${r.budget.max} calls); later sections may be incomplete.`);
  }
  return parts.join("\n") + "\n";
}

// ---- main -------------------------------------------------------------------------

export async function main({
  fetch = fetchGithub,
  today = new Date(),
  out = process.stdout,
  json = false,
  rootDir = root,
  projects,
  toolVersions,
} = {}) {
  if (!projects) projects = (await import("../src/data/projects.js")).default;
  if (!toolVersions) toolVersions = (await import("../src/data/toolStats.js")).TOOL_VERSIONS;

  const siteRepoNames = [];
  for (const p of projects) {
    const parsed = repoNameFromUrl(p.github);
    if (parsed && parsed.owner.toLowerCase() === OWNER && !siteRepoNames.some((n) => n.toLowerCase() === parsed.name.toLowerCase())) {
      siteRepoNames.push(parsed.name);
    }
  }
  const siteSet = new Set(siteRepoNames.map((n) => n.toLowerCase()));
  const releaseRepos = [...siteRepoNames];
  for (const k of Object.keys(toolVersions)) {
    if (!siteSet.has(k.toLowerCase())) releaseRepos.push(k);
  }

  const client = makeClient(fetch);
  const result = {
    date: today.toISOString().slice(0, 10),
    newRepos: await sectionA(client, siteSet, today),
    stateChanges: await sectionB(client, siteRepoNames),
    releases: await sectionC(client, releaseRepos, toolVersions, today),
    staleAnchors: scanAnchors(rootDir, today),
    budget: { calls: client.state.calls, max: MAX_CALLS, exhausted: client.state.exhausted },
  };
  out.write(json ? JSON.stringify(result, null, 2) + "\n" : renderMarkdown(result, today));
  return result;
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  try {
    await main({ json: process.argv.includes("--json") });
  } catch (err) {
    console.error(`drift report failed: ${err?.message ?? err}`);
  }
  process.exitCode = 0;
}
