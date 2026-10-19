#!/usr/bin/env node
// Generates public/github-activity.json (and refreshes public/last-known-commits.json)
// for Home §03 "Currently building".
//
// GitHub's Events API no longer carries payload.commits on a PushEvent (only
// {before, head, ref, ...}), so each push is resolved to commits through the compare
// endpoint (or the single-commit endpoint for a new branch, where `before` is all zeros).
//
// PRIVACY: a user token can return PRIVATE events from /users/{user}/events, so only
// public PushEvents on ek33450505/* repos are ever resolved or published.
//
// `time` is the commit's author date (committer date as a fallback), not the push time.
//
// Best-effort: never fails the build. On any failure (including an unexpected throw)
// github-activity.json is written as [] on a best-effort basis and last-known-commits.json
// (the previous good run) is left untouched; it is only rewritten when at least one
// commit resolved. No new request is issued once BUDGET_MS has elapsed.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { fetchJson } from "./lib/fetch-json.mjs";
import { githubHeaders } from "./lib/github.mjs";
import { writeAtomic } from "./lib/write-atomic.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultOutDir = path.join(root, "public");

const API_BASE = "https://api.github.com";
const OWNER = "ek33450505";
const MAX_COMMITS = 10;
const MAX_CALLS = 12; // total compare/commit requests per run
const MAX_MESSAGE = 200;
const BUDGET_MS = 45_000;

const SHA_RE = /^[0-9a-f]{40}$/;
const ZERO_SHA_RE = /^0{40}$/;
// "." and ".." are valid-looking path segments that would rewrite the request URL.
const REPO_RE = /^(?!\.{1,2}$)[A-Za-z0-9._-]+$/;

function fetchGithub(url) {
  return fetchJson(url, { idleMs: 4000, deadlineMs: 15000, headers: githubHeaders(url, process.env.GITHUB_TOKEN) });
}

// Pure — splits "owner/name" and requires the owner and a safe repo name, so nothing
// unvalidated reaches a request URL. Returns the repo name or null.
function ownRepoName(repoFull) {
  if (typeof repoFull !== "string") return null;
  const parts = repoFull.split("/");
  if (parts.length !== 2 || parts[0] !== OWNER || !REPO_RE.test(parts[1])) return null;
  return parts[1];
}

// Pure — the privacy gate. Public PushEvents on the owner's own, well-formed repos only.
export function selectPushEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.filter(
    (e) => e && e.type === "PushEvent" && e.public === true && ownRepoName(e.repo?.name) !== null
  );
}

// Pure — one API commit object to a consumer item, or null if anything is off.
export function toItem(repoFull, commit) {
  const repo = ownRepoName(repoFull);
  const sha = commit?.sha;
  if (repo === null || typeof sha !== "string" || !SHA_RE.test(sha)) return null;
  const rawMessage = commit?.commit?.message;
  if (typeof rawMessage !== "string") return null;
  const message = rawMessage.split("\n")[0].trim().slice(0, MAX_MESSAGE).trim();
  if (!message) return null;
  const time = commit?.commit?.author?.date ?? commit?.commit?.committer?.date;
  if (typeof time !== "string" || Number.isNaN(Date.parse(time))) return null;
  return { id: sha, repo, repoFull, sha, message, time };
}

// Resolves up to MAX_COMMITS commits, newest push first. Deduped by sha. A failed
// compare/commit call skips that push; no new call starts after budgetMs.
export async function collectCommits(events, fetch, { clock = Date.now, budgetMs = BUDGET_MS } = {}) {
  const start = clock();
  const items = [];
  const seen = new Set();
  let calls = 0;
  for (const e of selectPushEvents(events)) {
    if (items.length >= MAX_COMMITS || calls >= MAX_CALLS || clock() - start >= budgetMs) break;
    const repoFull = e.repo.name;
    const { before, head } = e.payload ?? {};
    if (typeof head !== "string" || !SHA_RE.test(head)) continue;
    const useCompare = typeof before === "string" && SHA_RE.test(before) && !ZERO_SHA_RE.test(before);
    const url = useCompare
      ? `${API_BASE}/repos/${repoFull}/compare/${before}...${head}`
      : `${API_BASE}/repos/${repoFull}/commits/${head}`;
    calls += 1;
    const body = await fetch(url);
    const commits = useCompare ? (Array.isArray(body?.commits) ? [...body.commits].reverse() : null) : body ? [body] : null;
    if (!commits) continue;
    // compare lists oldest first; reversed above so the newest commit of the push leads.
    for (const c of commits) {
      const item = toItem(repoFull, c);
      if (!item || seen.has(item.sha)) continue;
      seen.add(item.sha);
      items.push(item);
      if (items.length >= MAX_COMMITS) break;
    }
  }
  return items;
}

export async function main({ fetch = fetchGithub, outDir = defaultOutDir, now = new Date(), clock = Date.now } = {}) {
  try {
    const events = await fetch(`${API_BASE}/users/${OWNER}/events?per_page=30`);
    let items = [];
    if (Array.isArray(events)) {
      items = await collectCommits(events, fetch, { clock });
    } else {
      console.warn(`::warning title=sync-github-activity::events fetch failed; publishing an empty activity feed`);
    }
    if (events && items.length === 0) {
      console.warn(`::warning title=sync-github-activity::no public commits resolved; keeping last-known commits`);
    }
    writeAtomic(path.join(outDir, "github-activity.json"), JSON.stringify(items, null, 2) + "\n");
    if (items.length > 0) {
      const cachedAt = now.toISOString();
      writeAtomic(
        path.join(outDir, "last-known-commits.json"),
        JSON.stringify({ commits: items, cachedAt }, null, 2) + "\n"
      );
    }
    console.log(`[sync-github-activity] Wrote ${items.length} commit(s)`);
    return items;
  } catch (err) {
    // prebuild must never fail the deploy over this feed.
    console.warn(`::warning title=sync-github-activity::failed (${err?.message ?? err})`);
    try {
      writeAtomic(path.join(outDir, "github-activity.json"), "[]\n");
    } catch { /* nothing more to do; last-known is never touched here */ }
    return null;
  }
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) await main();
