// Weekly-refresh gate. Runs with NO node_modules: Node builtins and ./lib/*.mjs only.
//
//   node scripts/refresh-gate.mjs material --repo <dir>
//
// `material` decides whether the sync scripts changed anything beyond timestamp-only keys.
// stdout is exactly `material=<bool>`; details go to stderr; any error exits 1
// with an empty stdout.
//
//   node scripts/refresh-gate.mjs gate --repo <dir> --verdict <file>
//
// `gate` is the privileged check: it reads everything from the git INDEX of <dir> (the untrusted
// patch has been applied with `git apply --index`) against HEAD, and writes a verdict file LAST.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { parseDataModule, renderDataModule, jsonStyleOf, renderJsonLike } from "./lib/data-module.mjs";
import { isDirectInvocation } from "./lib/direct-invocation.mjs";
import { writeAtomic } from "./lib/write-atomic.mjs";

const feed = (p, kind, ignore = [], extra = {}) => ({
  path: p,
  kind,
  ignore: ignore.map((k) => k.split(".")),
  ...extra,
});

export const FEEDS = [
  feed("src/data/castStats.js", "js", ["CAST_STATS.updated"]),
  feed("src/data/atlasStats.js", "js", []),
  feed("src/data/toolStats.js", "js", []),
  feed("src/data/repoFacts.js", "js", ["REPO_FACTS.computeAtlas.treeAsOf", "REPO_FACTS.computeAtlas.commitsAsOf"]),
  feed("src/data/atlasPoints.js", "js", ["ATLAS_POINTS.asOf"]),
  feed("public/cast-stats.json", "json", ["updated"]),
  feed("public/atlas-stats.json", "json", ["edition.asOf"]),
  feed("public/tool-versions.json", "json"),
  feed("public/repo-facts.json", "json", ["computeAtlas.treeAsOf", "computeAtlas.commitsAsOf"]),
  feed("public/atlas-points.json", "json", ["asOf"]),
];

export const ALLOWLIST = FEEDS.map((f) => f.path);

const GIT_ENV = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_OPTIONAL_LOCKS: "0" };

function git(repoDir, args) {
  return execFileSync("git", ["-C", repoDir, ...args], {
    encoding: "utf8",
    env: GIT_ENV,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Raw blob bytes (`git cat-file blob`: no textconv, no filters). rev is `HEAD:<path>` or `:<path>`. */
function blob(repoDir, rev) {
  return execFileSync("git", ["-C", repoDir, "cat-file", "blob", rev], {
    env: GIT_ENV,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Text -> comparable object: js modules keyed by export name, json as parsed. */
export function parseFeed(f, text) {
  if (f.kind === "js") {
    return Object.fromEntries(parseDataModule(text).exports.map((e) => [e.name, e.value]));
  }
  return JSON.parse(text);
}

function deleteKeyPath(obj, keyPath) {
  let cur = obj;
  for (let i = 0; i < keyPath.length - 1; i++) {
    if (cur === null || typeof cur !== "object") return;
    cur = cur[keyPath[i]];
  }
  if (cur !== null && typeof cur === "object") delete cur[keyPath[keyPath.length - 1]];
}

export function stripIgnored(f, obj) {
  for (const keyPath of f.ignore) deleteKeyPath(obj, keyPath);
  return obj;
}

// Key ORDER is deliberately ignored here (a reorder is not a data change). It still changes bytes;
// the privileged gate's canonical-render check handles that separately.
export function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
}

/** Paths git reports as modified, deleted, renamed or untracked-and-not-ignored. */
export function statusPaths(repoDir) {
  const tokens = git(repoDir, ["status", "--porcelain", "-z", "--untracked-files=all"])
    .split("\0")
    .filter(Boolean);
  const paths = [];
  for (let i = 0; i < tokens.length; i++) {
    const entry = tokens[i];
    paths.push(entry.slice(3));
    if (/[RC]/.test(entry.slice(0, 2))) paths.push(tokens[++i]); // rename/copy: next token is the origin
  }
  return paths;
}

function isCanonicalModule(headText, newText) {
  const head = parseDataModule(headText);
  const next = parseDataModule(newText);
  const sameNames =
    head.exports.length === next.exports.length && head.exports.every((e, i) => e.name === next.exports[i].name);
  return sameNames && renderDataModule(head.segments, next.exports) === newText;
}

export function materialCheck(repoDir) {
  const changed = [];
  let material = false;

  for (const f of FEEDS) {
    const abs = path.join(repoDir, f.path);

    let oldObj;
    let headText;
    try {
      headText = blob(repoDir, `HEAD:${f.path}`).toString("utf8");
      oldObj = stripIgnored(f, parseFeed(f, headText));
    } catch (err) {
      throw new Error(`cannot parse HEAD:${f.path}: ${err.message}`);
    }

    let st = null;
    try {
      st = fs.lstatSync(abs);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    if (st && !st.isFile()) throw new Error(`${f.path} is not a regular file`);
    if (!st) {
      changed.push({ path: f.path, reason: "missing" });
      material = true;
      continue;
    }
    const newText = fs.readFileSync(abs, "utf8");
    let newObj;
    try {
      newObj = stripIgnored(f, parseFeed(f, newText));
    } catch (err) {
      throw new Error(`cannot parse ${f.path}: ${err.message}`);
    }

    // A js module must be the HEAD module's literal text with only values changed: same export
    // names in order, and nothing smuggled into banner/trailing segments or lowercase exports.
    if (f.kind === "js" && !isCanonicalModule(headText, newText)) {
      changed.push({ path: f.path, reason: "non-canonical module" });
      material = true;
      continue;
    }

    if (deepEqual(oldObj, newObj)) continue;
    changed.push({ path: f.path, reason: "changed" });
    material = true;
  }

  const allowed = new Set(ALLOWLIST);
  for (const p of statusPaths(repoDir)) {
    if (allowed.has(p)) continue;
    changed.push({ path: p, reason: "outside allowlist" });
    material = true;
  }

  return { material, changed };
}

function flagArg(args, name) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const repoArg = (args) => flagArg(args, "--repo");

function runMaterial(args) {
  const repo = repoArg(args);
  if (!repo) return { code: 2, stderr: "usage: refresh-gate.mjs material --repo <dir>" };
  let result;
  try {
    result = materialCheck(repo);
  } catch (err) {
    return { code: 1, stderr: `refresh-gate material: ${err.message}` };
  }
  const detail = result.changed.map((c) => `  ${c.path}: ${c.reason}`).join("\n") || "  (no changes)";
  return {
    code: 0,
    stdout: `material=${result.material}\n`,
    stderr: `changed:\n${detail}`,
  };
}

// ---------------------------------------------------------------------------------------------
// gate: privileged check of the staged (index) change against HEAD.
// ---------------------------------------------------------------------------------------------

const FEED_BY_PATH = new Map(FEEDS.map((f) => [f.path, f]));
const MAX_REASONS = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

// Reason text can carry attacker-influenced bytes and ends up in a PR body.
function sanitize(text) {
  return String(text)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff`<>]/g, "")
    .replace(/@/g, "(at)")
    .slice(0, 160);
}

// Structural codes are never dropped; only the (potentially numerous) data codes are capped.
const STRUCTURAL_CODES = new Set(["BAD_ENTRY", "PATH_NOT_ALLOWED", "JS_NOT_CANONICAL", "JSON_NOT_CANONICAL"]);

function makeCollector() {
  const reasons = [];
  let dataCount = 0;
  let dropped = 0;
  return {
    reasons,
    get dropped() {
      return dropped;
    },
    add(code, p, detail) {
      if (!STRUCTURAL_CODES.has(code) && ++dataCount > MAX_REASONS) {
        dropped++;
        return;
      }
      reasons.push({ code, path: sanitize(p), detail: sanitize(detail) });
    },
  };
}

/** `git diff --cached --raw -z` records: `:<oldmode> <newmode> <oldsha> <newsha> <status>\0<path>\0`. */
function stagedEntries(repoDir) {
  const tokens = git(repoDir, [
    "diff", "--cached", "--raw", "-z", "--no-renames", "--no-ext-diff", "--no-textconv", "HEAD",
  ]).split("\0");
  if (tokens.at(-1) === "") tokens.pop();
  const entries = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const m = /^:(\d{6}) (\d{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])\d*$/.exec(tokens[i]);
    if (!m || tokens[i + 1] === undefined) throw new Error(`cannot parse git diff record ${JSON.stringify(tokens[i])}`);
    entries.push({ oldMode: m[1], newMode: m[2], status: m[3], path: tokens[i + 1] });
  }
  return entries;
}

const jsonType = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

function hasProtoKey(v) {
  if (v === null || typeof v !== "object") return false;
  return Object.keys(v).some((k) => k === "__proto__" || hasProtoKey(v[k]));
}

// --- dates, versions -------------------------------------------------------------------------

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_FULL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

function parseDate(s) {
  const shape = DATE_ONLY_RE.test(s) ? "date" : ISO_FULL_RE.test(s) ? "iso" : null;
  if (!shape) return null;
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return null;
  const [y, mo, d] = s.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { shape, ms };
}

const VERSION_RE = /^(v?)(\d+)\.(\d+)\.(\d+)$/;

function parseVersion(s) {
  const m = VERSION_RE.exec(s);
  return m && { prefix: m[1], triple: [BigInt(m[2]), BigInt(m[3]), BigInt(m[4])] };
}

function tripleLower(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

// --- rules -----------------------------------------------------------------------------------

// Fields with a specific rule are checked ONLY by it (never also by BOUND_NUMBER).
const RULES = new Map();
const rule = (kind, ...keys) => keys.forEach((k) => RULES.set(k, kind));
rule(
  "facilities",
  "public/atlas-stats.json:count",
  "src/data/atlasStats.js:ATLAS_STATS.facilities",
  "public/atlas-points.json:count",
  "src/data/atlasPoints.js:ATLAS_POINTS.count",
);
rule("tests", "public/cast-stats.json:tests", "public/cast-stats.json:test_files", "src/data/castStats.js:CAST_STATS.tests");
for (const prefix of ["public/repo-facts.json:computeAtlas", "src/data/repoFacts.js:REPO_FACTS.computeAtlas"]) {
  rule("monotonic", `${prefix}.commits`, `${prefix}.claudeCoauthored`);
}
rule(
  "fixed",
  "public/atlas-points.json:w",
  "public/atlas-points.json:h",
  "src/data/atlasPoints.js:ATLAS_POINTS.w",
  "src/data/atlasPoints.js:ATLAS_POINTS.h",
);
rule(
  "version",
  "public/cast-stats.json:version",
  "public/cast-stats.json:versionTag",
  "src/data/castStats.js:CAST_STATS.version",
  "src/data/castStats.js:CAST_DESKTOP_STATS.version",
  "public/atlas-stats.json:edition.version",
  "src/data/atlasStats.js:ATLAS_STATS.version",
);
rule("pts", "public/atlas-points.json:pts");
rule("byStatus", "src/data/atlasPoints.js:ATLAS_POINTS.byStatus");

function ruleFor(f, segs) {
  const dotted = segs.join(".");
  const known = RULES.get(`${f.path}:${dotted}`);
  if (known) return known;
  if (f.ignore.some((k) => k.join(".") === dotted)) return "date";
  if (f.path === "public/tool-versions.json" && segs.length === 1) return "version";
  if (f.path === "src/data/toolStats.js" && segs[0] === "TOOL_VERSIONS" && segs.length === 2) return "version";
  return null;
}

function checkRule(kind, ctx, head, next, segs) {
  const { c, f } = ctx;
  const key = segs.join(".");
  const fail = (code, detail) => c.add(code, f.path, `${key}: ${detail}`);

  if (typeof head === "number") {
    if (!Number.isFinite(next) || next < 0) return fail("SCHEMA", `number ${next} is not finite and >= 0`);
  }

  switch (kind) {
    case "facilities":
      if (next < head * 0.75 || next > head * 1.25) fail("BOUND_FACILITIES", `${head} to ${next} outside +-25%`);
      break;
    case "tests":
      if (next < head * 0.9 || next > head * 1.5) fail("BOUND_TESTS", `${head} to ${next} outside [0.9x, 1.5x]`);
      break;
    case "monotonic":
      if (next < head) fail("BOUND_MONOTONIC", `${head} to ${next} went down`);
      break;
    case "fixed":
      if (next !== head) fail("BOUND_NUMBER", `${head} to ${next} must be unchanged`);
      break;
    case "version": {
      const nv = parseVersion(next);
      if (!nv) return fail("VERSION", `${JSON.stringify(next)} is not a version`);
      const ov = parseVersion(head);
      if (!ov) break;
      if (nv.prefix !== ov.prefix) fail("VERSION", `v-prefix style changed (${head} to ${next})`);
      else if (tripleLower(nv.triple, ov.triple)) fail("VERSION", `${head} to ${next} went down`);
      else if (nv.triple[0] > ov.triple[0] + 1n) fail("VERSION", `${head} to ${next} jumps more than one major`);
      break;
    }
    case "date": {
      const nd = parseDate(next);
      if (!nd) return fail("DATE", `${JSON.stringify(next)} is not a valid date`);
      const od = parseDate(head);
      if (od && od.shape !== nd.shape) fail("DATE", `shape changed (${head} to ${next})`);
      else if (od && nd.ms < od.ms) fail("DATE", `${head} to ${next} went backwards`);
      else if (nd.ms > Date.now() + DAY_MS) fail("DATE", `${next} is in the future`);
      break;
    }
    case "pts":
      checkPoints(ctx, next, fail);
      break;
    case "byStatus":
      checkByStatus(head, next, fail);
      break;
    default:
      throw new Error(`unknown rule ${kind}`);
  }
}

function checkPoints(ctx, pts, fail) {
  const { count, w, h, statuses } = ctx.next;
  if (![count, w, h].every(Number.isInteger) || !Array.isArray(statuses)) {
    return fail("POINTS", "count, w, h or statuses is malformed");
  }
  if (pts.length !== 3 * count) return fail("POINTS", `length ${pts.length} is not 3 x count ${count}`);
  for (let i = 0; i < pts.length; i += 3) {
    const [x, y, s] = [pts[i], pts[i + 1], pts[i + 2]];
    const ok =
      [x, y, s].every(Number.isInteger) && x >= 0 && x <= w && y >= 0 && y <= h && s >= 0 && s < statuses.length;
    if (!ok) return fail("POINTS", `point ${i / 3} is out of range or not an integer`);
  }
}

function checkByStatus(head, byStatus, fail) {
  if (JSON.stringify(Object.keys(byStatus).sort()) !== JSON.stringify(Object.keys(head).sort())) {
    return fail("POINTS", "status keys changed");
  }
  if (!Object.values(byStatus).every((n) => Number.isInteger(n) && n >= 0)) {
    fail("POINTS", "a count is not a non-negative integer");
  }
}

/**
 * The hero map is two feeds that must agree: the point list (public/atlas-points.json) and its
 * summary (src/data/atlasPoints.js). Both are read from the index, changed or not.
 */
function crossCheckPoints(repoDir, c) {
  const jsonPath = "public/atlas-points.json";
  const jsPath = "src/data/atlasPoints.js";
  let json;
  let summary;
  try {
    json = JSON.parse(blob(repoDir, `:${jsonPath}`).toString("utf8"));
    summary = parseFeed(FEED_BY_PATH.get(jsPath), blob(repoDir, `:${jsPath}`).toString("utf8")).ATLAS_POINTS;
  } catch {
    return; // an unparseable side was already reported for its own feed
  }
  const fail = (detail) => c.add("POINTS", jsPath, detail);
  const { pts, statuses, count } = json;
  if (!Array.isArray(pts) || !Array.isArray(statuses) || !summary || typeof summary.byStatus !== "object") {
    return fail("cannot cross-check the point feeds: malformed");
  }
  if (summary.count !== count) fail(`ATLAS_POINTS.count ${summary.count} differs from atlas-points.json count ${count}`);
  if (pts.length !== 3 * count) return fail(`pts holds ${pts.length / 3} points, count is ${count}`);
  const recount = statuses.map(() => 0);
  for (let i = 2; i < pts.length; i += 3) if (Number.isInteger(pts[i]) && pts[i] < recount.length) recount[pts[i]]++;
  if (JSON.stringify(Object.keys(summary.byStatus).sort()) !== JSON.stringify([...statuses].sort())) {
    return fail("byStatus keys differ from the statuses list");
  }
  statuses.forEach((status, i) => {
    if (summary.byStatus[status] !== recount[i]) {
      fail(`byStatus.${status} is ${summary.byStatus[status]} but the points hold ${recount[i]}`);
    }
  });
}

// --- schema walk -----------------------------------------------------------------------------

function walk(ctx, head, next, segs) {
  const { c, f } = ctx;
  const key = segs.join(".") || "(root)";
  const headType = jsonType(head);
  if (headType !== jsonType(next)) return c.add("SCHEMA", f.path, `${key}: type ${headType} to ${jsonType(next)}`);

  const kind = ruleFor(f, segs);
  if (kind) return checkRule(kind, ctx, head, next, segs);

  switch (headType) {
    case "object": {
      const hk = Object.keys(head);
      const nk = Object.keys(next);
      const missing = hk.filter((k) => !nk.includes(k));
      const extra = nk.filter((k) => !hk.includes(k));
      if (missing.length || extra.length) {
        c.add("SCHEMA", f.path, `${key}: keys differ (missing ${missing.join(",") || "-"}, extra ${extra.join(",") || "-"})`);
      }
      for (const k of hk) if (nk.includes(k)) walk(ctx, head[k], next[k], [...segs, k]);
      break;
    }
    case "array":
      if (head.length !== next.length) {
        c.add("SCHEMA", f.path, `${key}: length ${head.length} to ${next.length}`);
        break;
      }
      head.forEach((v, i) => walk(ctx, v, next[i], [...segs, String(i)]));
      break;
    case "string":
      if (head !== next) c.add("STRING_CHANGED", f.path, `${key}: ${JSON.stringify(head)} to ${JSON.stringify(next)}`);
      break;
    case "number":
      if (!Number.isFinite(next) || next < 0) {
        c.add("SCHEMA", f.path, `${key}: number ${next} is not finite and >= 0`);
      } else if (Math.abs(head) >= 10 ? next < head * 0.5 || next > head * 1.5 : Math.abs(next - head) > 5) {
        c.add("BOUND_NUMBER", f.path, `${key}: ${head} to ${next}`);
      }
      break;
    default:
      // boolean, null: a literal, so it must equal HEAD
      if (head !== next) c.add("STRING_CHANGED", f.path, `${key}: ${JSON.stringify(head)} to ${JSON.stringify(next)}`);
  }
}

// Same keys in the same order at every depth (key SETS are the schema check's job).
function keyOrderDiffers(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return a.some((v, i) => i < b.length && keyOrderDiffers(v, b[i]));
  if (jsonType(a) !== "object" || jsonType(b) !== "object") return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  const shared = (k) => bk.includes(k);
  if (ak.filter(shared).join("\0") !== bk.filter((k) => ak.includes(k)).join("\0")) return true;
  return ak.some((k) => shared(k) && keyOrderDiffers(a[k], b[k]));
}

/** Checks 2-4 for one js/json feed. Returns true when the feed changed materially. */
function checkDataFeed(repoDir, f, c) {
  let headText;
  let oldFull;
  try {
    headText = blob(repoDir, `HEAD:${f.path}`).toString("utf8");
    oldFull = parseFeed(f, headText);
  } catch (err) {
    throw new Error(`cannot parse HEAD:${f.path}: ${err.message}`);
  }
  const newText = blob(repoDir, `:${f.path}`).toString("utf8");
  const canonicalCode = f.kind === "js" ? "JS_NOT_CANONICAL" : "JSON_NOT_CANONICAL";

  let newFull;
  try {
    newFull = parseFeed(f, newText);
  } catch (err) {
    c.add(canonicalCode, f.path, `unparseable: ${err.message}`);
    return true;
  }

  let canonical;
  if (f.kind === "js") {
    canonical = isCanonicalModule(headText, newText);
  } else {
    canonical = !hasProtoKey(newFull) && renderJsonLike(newFull, jsonStyleOf(headText)) === newText;
  }
  if (!canonical) c.add(canonicalCode, f.path, "not the canonical rendering of its parsed value");
  else if (keyOrderDiffers(oldFull, newFull)) {
    canonical = false;
    c.add(canonicalCode, f.path, "key order differs from HEAD");
  }

  const changed = !deepEqual(stripIgnored(f, structuredClone(oldFull)), stripIgnored(f, structuredClone(newFull)));

  if (!hasProtoKey(newFull)) walk({ c, f, next: newFull }, oldFull, newFull, []);

  if (f.path === "public/repo-facts.json" || f.path === "src/data/repoFacts.js") {
    const facts = f.kind === "json" ? newFull.computeAtlas : newFull.REPO_FACTS?.computeAtlas;
    if (facts && facts.claudeCoauthored > facts.commits) {
      c.add("BOUND_MONOTONIC", f.path, `claudeCoauthored ${facts.claudeCoauthored} exceeds commits ${facts.commits}`);
    }
  }
  return !canonical || changed;
}

// --- entry point -----------------------------------------------------------------------------

export function gateCheck(repoDir) {
  const c = makeCollector();
  const entries = stagedEntries(repoDir);
  if (!entries.length) throw new Error("nothing is staged");
  let material = false;

  // Worktree must equal the index: the workflow commits the index, but any stray file is a red flag.
  const status = git(repoDir, ["status", "--porcelain", "-z", "--untracked-files=all", "--no-renames"])
    .split("\0")
    .filter(Boolean);
  for (const rec of status) {
    if (rec[1] !== " ") {
      c.add("BAD_ENTRY", rec.slice(3), "worktree differs from the index");
      material = true;
    }
  }

  const analyze = [];
  for (const e of entries) {
    const f = FEED_BY_PATH.get(e.path);
    if (!f) {
      c.add("PATH_NOT_ALLOWED", e.path, "not on the allowlist");
      material = true;
    }
    if (e.status !== "M" || e.oldMode !== "100644" || e.newMode !== "100644") {
      c.add("BAD_ENTRY", e.path, `status ${e.status}, mode ${e.oldMode} to ${e.newMode}`);
      material = true;
    } else if (f) {
      analyze.push(f);
    }
  }

  for (const f of analyze) {
    if (checkDataFeed(repoDir, f, c)) material = true;
  }
  if (analyze.some((f) => f.path === "public/atlas-points.json" || f.path === "src/data/atlasPoints.js")) {
    crossCheckPoints(repoDir, c);
  }

  if (!material) throw new Error("build reported material but nothing material changed");
  return { reasons: c.reasons, dropped: c.dropped, changed: entries.map((e) => sanitize(e.path)) };
}

function runGate(args) {
  const repo = repoArg(args);
  const verdictPath = flagArg(args, "--verdict");
  if (!repo || !verdictPath) return { code: 2, stderr: "usage: refresh-gate.mjs gate --repo <dir> --verdict <file>" };

  try {
    fs.rmSync(verdictPath, { force: true });
    const { reasons, dropped, changed } = gateCheck(repo);
    const verdict = reasons.length ? "needs-ed" : "eligible";
    // Written LAST: a verdict file exists only if every check above completed.
    writeAtomic(verdictPath, `${JSON.stringify({ verdict, reasons, dropped, changed }, null, 2)}\n`);
    const lines = reasons.map((r) => `  ${r.code} ${r.path}: ${r.detail}`).join("\n");
    return { code: reasons.length ? 3 : 0, stderr: `verdict=${verdict}${lines ? `\n${lines}` : ""}` };
  } catch (err) {
    return { code: 1, stderr: `refresh-gate gate: ${err.message}` };
  }
}

export const SUBCOMMANDS = { material: runMaterial, gate: runGate };

export function main(argv) {
  const [sub, ...rest] = argv;
  const run = SUBCOMMANDS[sub];
  if (!run) {
    process.stderr.write(`usage: refresh-gate.mjs <${Object.keys(SUBCOMMANDS).join("|")}> --repo <dir>\n`);
    return 2;
  }
  const { code, stdout, stderr } = run(rest);
  if (stderr) process.stderr.write(`${stderr}\n`);
  if (stdout && code === 0) process.stdout.write(stdout);
  return code;
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
