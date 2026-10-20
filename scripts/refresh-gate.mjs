// Weekly-refresh gate. Runs with NO node_modules: Node builtins and ./lib/*.mjs only.
//
//   node scripts/refresh-gate.mjs material --repo <dir>
//
// `material` decides whether the sync scripts changed anything beyond timestamp-only keys.
// stdout is exactly `material=<bool>` and `pdfs=<bool>`; details go to stderr; any error exits 1
// with an empty stdout. (The privileged `gate` subcommand lands in SUBCOMMANDS below.)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { parseDataModule, renderDataModule } from "./lib/data-module.mjs";
import { isDirectInvocation } from "./lib/direct-invocation.mjs";

const feed = (p, kind, ignore = [], extra = {}) => ({
  path: p,
  kind,
  ignore: ignore.map((k) => k.split(".")),
  pdf: false,
  ridesAlong: false,
  ...extra,
});

export const FEEDS = [
  feed("src/data/castStats.js", "js", ["CAST_STATS.updated"], { pdf: true }),
  feed("src/data/atlasStats.js", "js", [], { pdf: true }),
  feed("src/data/toolStats.js", "js", [], { pdf: true }),
  feed("src/data/repoFacts.js", "js", ["REPO_FACTS.computeAtlas.treeAsOf", "REPO_FACTS.computeAtlas.commitsAsOf"]),
  feed("src/data/atlasPoints.js", "js", ["ATLAS_POINTS.asOf"]),
  feed("public/cast-stats.json", "json", ["updated"]),
  feed("public/atlas-stats.json", "json", ["edition.asOf"]),
  feed("public/tool-versions.json", "json"),
  feed("public/repo-facts.json", "json", ["computeAtlas.treeAsOf", "computeAtlas.commitsAsOf"]),
  feed("public/atlas-points.json", "json", ["asOf"]),
  feed("public/last-known-commits.json", "json", ["cachedAt"], { ridesAlong: true }),
  feed("public/Edward_Kubiak_Resume.pdf", "pdf"),
  feed("public/CAST_Portfolio_OnePager.pdf", "pdf"),
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
  let pdfs = false;
  let material = false;

  for (const f of FEEDS) {
    if (f.kind === "pdf") continue;
    const abs = path.join(repoDir, f.path);

    let oldObj;
    let headText;
    try {
      headText = git(repoDir, ["show", `HEAD:${f.path}`]);
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
      if (!f.ridesAlong) material = true;
      if (f.pdf) pdfs = true;
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
      if (f.pdf) pdfs = true;
      continue;
    }

    if (deepEqual(oldObj, newObj)) continue;
    changed.push({ path: f.path, reason: f.ridesAlong ? "changed (rides along)" : "changed" });
    if (!f.ridesAlong) material = true;
    if (f.pdf) pdfs = true;
  }

  const allowed = new Set(ALLOWLIST);
  for (const p of statusPaths(repoDir)) {
    if (allowed.has(p)) continue;
    changed.push({ path: p, reason: "outside allowlist" });
    material = true;
  }

  return { material, pdfs, changed };
}

function repoArg(args) {
  const i = args.indexOf("--repo");
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

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
    stdout: `material=${result.material}\npdfs=${result.pdfs}\n`,
    stderr: `changed:\n${detail}`,
  };
}

// U1.2 adds `gate` here.
export const SUBCOMMANDS = { material: runMaterial };

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
