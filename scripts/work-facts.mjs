#!/usr/bin/env node
// LOCAL-ONLY: prints today's CrossCheck numbers from Ed's own clone so the dated
// claims on the resume/site can be refreshed by hand. Work-repo data must never flow
// through CI or automation: this is NOT in prebuild or any workflow, writes nothing,
// never fetches, and only runs read-only `git -C <dir>` commands.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isDirectInvocation } from "./lib/direct-invocation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REF = "origin/QA";
// Anchored to the start of the name or email, so "Fred Kubiak" does not count.
const AUTHOR_RE = "(^|<)(edward[ _]|ed )kubiak";
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const CLAIM_FILES = ["src/data/resume.js", "src/data/projects.js", "scripts/build-resume-pdf.mjs"];

const CODE_RE = /^src\/.*\.(js|jsx|ts|tsx)$/;
const CSS_RE = /^src\/.*\.css$/;
const TEST_RE = /^src\/.*\.test\.(js|jsx|ts|tsx)$/;
const SES_CODE_RE = /^ses\/src\/.*\.(js|jsx|ts|tsx)$/;
const SES_CSS_RE = /^ses\/src\/.*\.css$/;
export const TEST_DECL_RE = /^\s*(it|test)(\.each\([^)]*\))?\s*\(/;

export function expandHome(p) {
  return p === "~" || p.startsWith("~/") ? path.join(os.homedir(), p.slice(1)) : p;
}

/** Buckets repo paths: src code (tests included), lines-bearing files (code + css), test files, ses/ apart. */
export function classifyPaths(paths) {
  const out = { code: [], app: [], css: [], lines: [], tests: [], sesCode: [], sesLines: [] };
  for (const p of paths) {
    if (CODE_RE.test(p)) {
      out.code.push(p);
      out.lines.push(p);
      if (TEST_RE.test(p)) out.tests.push(p);
      else out.app.push(p);
    } else if (CSS_RE.test(p)) {
      out.css.push(p);
      out.lines.push(p);
    } else if (SES_CODE_RE.test(p)) {
      out.sesCode.push(p);
      out.sesLines.push(p);
    } else if (SES_CSS_RE.test(p)) {
      out.sesLines.push(p);
    }
  }
  return out;
}

/** wc -l semantics: newline count (an unterminated last line is not counted), which reproduces the published figures. */
export function countLines(buf) {
  let n = 0;
  for (const b of buf) if (b === 0x0a) n++;
  return n;
}

export function countDeclaredTests(text) {
  return text.split("\n").filter((l) => TEST_DECL_RE.test(l)).length;
}

/** Parses `git ls-tree -r` output into [{ path, sha }] (blobs only). */
export function parseLsTree(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const m = /^\d+ blob ([0-9a-f]+)\t(.+)$/.exec(line);
    if (m) rows.push({ sha: m[1], path: m[2] });
  }
  return rows;
}

/** Parses `git cat-file --batch` output (`<sha> blob <size>\n<bytes>\n`) into a Map sha -> Buffer. */
export function parseCatBatch(buf) {
  const blobs = new Map();
  let pos = 0;
  while (pos < buf.length) {
    const nl = buf.indexOf(0x0a, pos);
    if (nl === -1) break;
    const m = /^([0-9a-f]+) blob (\d+)$/.exec(buf.toString("latin1", pos, nl));
    if (!m) {
      pos = nl + 1; // "<sha> missing" and the like
      continue;
    }
    const size = Number(m[2]);
    blobs.set(m[1], buf.subarray(nl + 1, nl + 1 + size));
    pos = nl + 1 + size + 1;
  }
  return blobs;
}

export function makeGit(dir) {
  return (args, input) =>
    execFileSync("git", ["-C", dir, ...args], {
      input,
      maxBuffer: 1024 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
}

/** Conservative ref/sha check: never starts with "-", no ".." or "@{". Throws on anything else. */
export function validateRef(ref) {
  if (!ref || !REF_RE.test(ref) || ref.includes("..") || ref.includes("@{") || ref.endsWith("/") || ref.endsWith(".lock")) {
    throw new Error(`invalid --ref: ${JSON.stringify(ref)}`);
  }
  return ref;
}

/** Resolves the ref once; every later git call receives only the resulting full sha. */
export function resolveCommit(git, ref, asOf) {
  let sha;
  try {
    sha = git(["rev-parse", "--verify", "--quiet", "--end-of-options", `${ref}^{commit}`]).toString().trim();
  } catch {
    throw new Error(`unknown ref: ${ref}`);
  }
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`unknown ref: ${ref}`);
  if (!asOf) return sha;
  return git(["rev-list", "-1", `--before=${asOf}T23:59`, sha]).toString().trim();
}

/**
 * Per author-name commit counts from "name <email>" log lines, flagged Ed by the same pattern git's
 * --author uses (matched against the full line). Names only: colleagues' emails are not echoed.
 */
export function identityBreakdown(logText) {
  const re = new RegExp(AUTHOR_RE, "i");
  const byName = new Map();
  for (const line of logText.split("\n")) {
    if (!line) continue;
    const name = line.replace(/\s*<[^>]*>\s*$/, "");
    const e = byName.get(name) ?? { id: name, commits: 0, ed: false };
    e.commits++;
    e.ed ||= re.test(line);
    byName.set(name, e);
  }
  return [...byName.values()].sort((a, b) => b.commits - a.commits || a.id.localeCompare(b.id));
}

export function gather(git, ref, asOf) {
  const commit = resolveCommit(git, ref, asOf);
  if (!commit) throw new Error(`no commit on ${ref} at or before ${asOf}`);
  const [short, date] = git(["show", "-s", "--format=%h%x09%cs", commit]).toString().trim().split("\t");
  const total = Number(git(["rev-list", "--count", commit]).toString().trim());
  const ed = Number(git(["rev-list", "--count", "-E", "-i", `--author=${AUTHOR_RE}`, commit]).toString().trim());

  const identities = identityBreakdown(git(["log", "--format=%an <%ae>", commit]).toString());
  const rows = parseLsTree(git(["ls-tree", "-r", commit]).toString());
  const cls = classifyPaths(rows.map((r) => r.path));
  const shaOf = new Map(rows.map((r) => [r.path, r.sha]));
  const wanted = [...new Set([...cls.lines, ...cls.sesLines].map((p) => shaOf.get(p)))];
  const blobs = parseCatBatch(git(["cat-file", "--batch"], wanted.join("\n") + "\n"));
  const blobOf = (p) => blobs.get(shaOf.get(p)) ?? Buffer.alloc(0);

  const sum = (paths) => paths.reduce((n, p) => n + countLines(blobOf(p)), 0);
  const declared = cls.tests.reduce((n, p) => n + countDeclaredTests(blobOf(p).toString("utf8")), 0);

  return {
    ref,
    asOf: asOf ?? null,
    commit: short,
    commitDate: date,
    commitsTotal: total,
    commitsEd: ed,
    identities,
    sourceFiles: cls.code.length,
    lines: sum(cls.lines),
    appLines: sum(cls.app),
    testLines: sum(cls.tests),
    cssLines: sum(cls.css),
    testFiles: cls.tests.length,
    declaredTests: declared,
    sesFiles: cls.sesCode.length,
    sesLines: sum(cls.sesLines),
  };
}

export function metricRows(f) {
  const n = (v) => v.toLocaleString("en-US");
  return [
    ["commits (total)", n(f.commitsTotal), "git rev-list --count; all commits, merges included"],
    [
      "commits (Ed)",
      n(f.commitsEd),
      `-E -i --author='${AUTHOR_RE}'; matches name or email, so check the identity breakdown below`,
    ],
    ["source files", n(f.sourceFiles), "src/**/*.{js,jsx,ts,tsx}, tests included"],
    ["lines (total)", n(f.lines), "code + tests + css below, wc -l semantics (count of \\n per file; an unterminated last line is not counted)"],
    ["  application code", n(f.appLines), "src/**/*.{js,jsx,ts,tsx} excluding *.test.*"],
    ["  tests", n(f.testLines), "src/**/*.test.{js,jsx,ts,tsx}"],
    ["  css", n(f.cssLines), "src/**/*.css"],
    ["test files", n(f.testFiles), "src/**/*.test.{js,jsx,ts,tsx}"],
    [
      "declared test cases",
      n(f.declaredTests),
      "declared (static): it(/test( lines; .each expands at runtime, so this is NOT the 'tests passing' figure. Get that from a test run (see --help)",
    ],
    ["ses/ files", n(f.sesFiles), "ses/src/**/*.{js,jsx,ts,tsx}; SES-Wiki moved in 2026-10-19, NOT in the src figures"],
    ["ses/ lines", n(f.sesLines), "ses/src code plus css; NOT in the src figures"],
  ];
}

// Phrases, not literals: the wording changes whenever the claims are refreshed.
const CLAIM_RE = /tests across|commits as of|source files|tests passing|lines of application code|lines of tests|of them are mine/i;

/** Lines in the given [{file, text}] that carry a CrossCheck figure -> [{file, line, snippet}]. */
export function findClaims(files) {
  const hits = [];
  for (const { file, text } of files) {
    text.split("\n").forEach((line, i) => {
      const m = CLAIM_RE.exec(line);
      if (!m) return;
      const start = Math.max(0, m.index - 70);
      const snippet = line.slice(start, m.index + 90).trim();
      hits.push({ file, line: i + 1, snippet: `${start > 0 ? "..." : ""}${snippet}${m.index + 90 < line.length ? "..." : ""}` });
    });
  }
  return hits;
}

export function parseArgs(argv) {
  const opts = { ref: DEFAULT_REF, asOf: null, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--ref" || a === "--as-of") {
      const v = argv[++i];
      if (!v) throw new Error(`${a} needs a value`);
      if (a === "--ref") opts.ref = validateRef(v);
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("--as-of must be YYYY-MM-DD");
      else opts.asOf = v;
    } else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

export const HELP = `Usage: node scripts/work-facts.mjs [--ref <ref>] [--as-of YYYY-MM-DD] [--json] [--help]

Prints CrossCheck numbers from your LOCAL clone ($CROSSCHECK_DIR, required).
Local-only: never run from CI/prebuild; read-only git; never fetches; writes nothing.
  --ref      ref to measure (default ${DEFAULT_REF}; a sha works)
  --as-of    last commit on the ref at or before that date (end of day, local time)
  --json     machine-readable output

"Tests passing" needs a real test run, which this script does NOT do. Read-only recipe:
  D=$(mktemp -d); git -C <dir> archive origin/QA | tar -x -C "$D"
  ln -s <dir>/node_modules "$D/node_modules"; cd "$D"
  npx vitest run --cache=false --reporter=json
(the JSON's numPassedTests is the figure; never run npm or tests inside the clone itself)
`;

export function main({
  argv = process.argv.slice(2),
  env = process.env,
  makeRunner = makeGit,
  claimFiles = null,
  out = (s) => process.stdout.write(`${s}\n`),
  err = (s) => process.stderr.write(`${s}\n`),
} = {}) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    err(`work-facts: ${e.message}`);
    return 1;
  }
  if (opts.help) {
    out(HELP);
    return 0;
  }
  if (!env.CROSSCHECK_DIR) {
    err("work-facts: set CROSSCHECK_DIR to your local CrossCheck clone, e.g. `export CROSSCHECK_DIR=/path/to/crosscheck` in your shell profile");
    return 1;
  }
  const dir = path.resolve(expandHome(env.CROSSCHECK_DIR));
  if (!fs.existsSync(dir)) {
    err(`work-facts: ${dir} does not exist (set CROSSCHECK_DIR to your local CrossCheck clone)`);
    return 1;
  }
  const git = makeRunner(dir);
  try {
    git(["rev-parse", "--git-dir"]);
  } catch {
    err(`work-facts: ${dir} is not a git repository`);
    return 1;
  }

  let facts;
  try {
    facts = gather(git, opts.ref, opts.asOf);
  } catch (e) {
    err(`work-facts: ${String(e.message).split("\n")[0]}`);
    return 1;
  }
  const files =
    claimFiles ?? CLAIM_FILES.map((file) => ({ file, text: fs.readFileSync(path.join(ROOT, file), "utf8") }));
  const claims = findClaims(files);

  if (opts.json) {
    out(JSON.stringify({ ...facts, claims }, null, 2));
    return 0;
  }
  const rows = metricRows(facts);
  const w = Math.max(...rows.map((r) => r[0].length));
  const v = Math.max(...rows.map((r) => r[1].length));
  out(`CrossCheck facts: ${facts.ref}${facts.asOf ? ` as of ${facts.asOf}` : ""} @ ${facts.commit} (${facts.commitDate})`);
  out("Numbers reflect your last fetch; run `git -C <dir> fetch` yourself for fresh data (this script never fetches).");
  out("");
  for (const [m, val, def] of rows) out(`${m.padEnd(w)}  ${val.padStart(v)}  ${def}`);
  out("");
  out("Identity breakdown (local only; Ed = matches the pattern above):");
  for (const i of facts.identities) out(`  ${i.ed ? "Ed    " : "other "} ${String(i.commits).padStart(5)}  ${i.id}`);
  out("");
  out("Published claims to compare:");
  if (claims.length === 0) out("  (none found)");
  for (const c of claims) out(`  ${c.file}:${c.line}  ${c.snippet}`);
  return 0;
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  process.exitCode = main();
}
