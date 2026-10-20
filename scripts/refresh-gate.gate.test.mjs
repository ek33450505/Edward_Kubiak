// The privileged `gate` subcommand. Every case runs the real CLI against a temp git repo whose
// HEAD holds copies of the committed feeds and PDFs, with the mutation staged in the index.
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import { FEEDS } from "./refresh-gate.mjs";
import { parseDataModule, renderDataModule, jsonStyleOf, renderJsonLike } from "./lib/data-module.mjs";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const script = path.join(repo, "scripts", "refresh-gate.mjs");
const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };

const RESUME = "public/Edward_Kubiak_Resume.pdf";
const ONEPAGER = "public/CAST_Portfolio_OnePager.pdf";

let template;
const cleanups = [];

function git(dir, ...args) {
  return execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], {
    env: GIT_ENV,
    encoding: "utf8",
  });
}

beforeAll(() => {
  // realpath: macOS tmpdir is a /var -> /private/var symlink.
  template = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "refresh-gate-gate-tpl-")));
  // The PDFs and last-known-commits.json are not feeds but stay tracked, so changing them can be tested.
  const extra = ["public/last-known-commits.json", RESUME, ONEPAGER].map((p) => ({ path: p }));
  for (const f of [...FEEDS, ...extra]) {
    fs.mkdirSync(path.dirname(path.join(template, f.path)), { recursive: true });
    fs.copyFileSync(path.join(repo, f.path), path.join(template, f.path));
  }
  fs.writeFileSync(path.join(template, "README.md"), "# readme\n");
  git(template, "init", "-q");
  git(template, "add", "-A");
  git(template, "commit", "-q", "-m", "fixture");
});

afterAll(() => fs.rmSync(template, { recursive: true, force: true }));

afterEach(() => {
  while (cleanups.length) cleanups.pop()();
});

function freshRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "refresh-gate-gate-")));
  fs.cpSync(template, dir, { recursive: true });
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Edit a feed: js gets {NAME: value}, json gets the parsed value. Style is preserved. */
function ed(dir, relPath, mutate) {
  const abs = path.join(dir, relPath);
  const text = fs.readFileSync(abs, "utf8");
  if (relPath.endsWith(".js")) {
    const { segments, exports } = parseDataModule(text);
    const byName = Object.fromEntries(exports.map((e) => [e.name, e.value]));
    mutate(byName);
    fs.writeFileSync(abs, renderDataModule(segments, exports.map((e) => ({ name: e.name, value: byName[e.name] }))));
  } else {
    const value = JSON.parse(text);
    const replaced = mutate(value);
    fs.writeFileSync(abs, renderJsonLike(replaced ?? value, jsonStyleOf(text)));
  }
}

const rawEdit = (dir, rel, fn) => {
  const abs = path.join(dir, rel);
  fs.writeFileSync(abs, fn(fs.readFileSync(abs, "utf8")));
};

/** PDFs are edited as latin1 so every byte round-trips. */
const pdfEdit = (dir, rel, fn) => {
  const abs = path.join(dir, rel);
  fs.writeFileSync(abs, Buffer.from(fn(fs.readFileSync(abs).toString("latin1")), "latin1"));
};

/** The honest, eligible baseline change: first TOOL_VERSIONS patch bump, both mirrors. */
function bump(dir) {
  const first = Object.keys(JSON.parse(fs.readFileSync(path.join(dir, "public/tool-versions.json"), "utf8")))[0];
  const up = (v) => v.replace(/(\d+)$/, (n) => String(Number(n) + 1));
  ed(dir, "public/tool-versions.json", (v) => { v[first] = up(v[first]); });
  ed(dir, "src/data/toolStats.js", (m) => { m.TOOL_VERSIONS[first] = up(m.TOOL_VERSIONS[first]); });
}

function run(dir, { stage = true } = {}) {
  if (stage) git(dir, "add", "-A");
  const verdictFile = path.join(dir, "..", `verdict-${path.basename(dir)}.json`);
  cleanups.push(() => fs.rmSync(verdictFile, { force: true }));
  const r = spawnSync("node", [script, "gate", "--repo", dir, "--verdict", verdictFile], { env: GIT_ENV, encoding: "utf8" });
  const verdict = fs.existsSync(verdictFile) ? JSON.parse(fs.readFileSync(verdictFile, "utf8")) : null;
  const codes = verdict ? [...new Set(verdict.reasons.map((x) => x.code))].sort() : null;
  return { status: r.status, stderr: r.stderr, stdout: r.stdout, verdict, codes, verdictFile };
}

const expectResult = (r, status, codes) => {
  expect(r.status, r.stderr).toBe(status);
  if (status === 0 || status === 3) {
    expect(r.codes).toEqual(codes);
    expect(r.verdict.verdict).toBe(status === 0 ? "eligible" : "needs-ed");
    expect(r.verdict.reasons.length === 0).toBe(status === 0);
  } else {
    expect(r.verdict).toBeNull();
  }
};

// [name, mutate(dir), expected exit, expected unique codes]. Every case includes a material change.
const CASES = [
  ["honest tool version bump", bump, 0, []],
  ["bump + one README line (probe)", (d) => { bump(d); fs.appendFileSync(path.join(d, "README.md"), "more\n"); }, 3, ["PATH_NOT_ALLOWED"]],
  [
    "halved facilities (probe)",
    (d) => {
      ed(d, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.facilities = Math.floor(m.ATLAS_STATS.facilities / 2); });
      ed(d, "public/atlas-stats.json", (v) => { v.count = Math.floor(v.count / 2); });
    },
    3,
    ["BOUND_FACILITIES"],
  ],
  ["only a dates change is not material", (d) => {
    ed(d, "public/cast-stats.json", (v) => { v.updated = "2026-10-20"; });
    ed(d, "src/data/castStats.js", (m) => { m.CAST_STATS.updated = "2026-10-20"; });
  }, 1, null],
  [
    "an unparseable HEAD feed is an error",
    (d) => {
      fs.writeFileSync(path.join(d, "public/repo-facts.json"), "{garbage");
      git(d, "commit", "-q", "-am", "garbage");
      bump(d);
      fs.copyFileSync(path.join(repo, "public/repo-facts.json"), path.join(d, "public/repo-facts.json"));
    },
    1,
    null,
  ],

  // --- check 1: entries
  [
    "a new untracked file",
    (d) => { bump(d); git(d, "add", "-A"); fs.writeFileSync(path.join(d, "notes.txt"), "x"); },
    3,
    ["BAD_ENTRY"],
    { stage: false },
  ],
  [
    "an unstaged worktree change",
    (d) => { bump(d); git(d, "add", "-A"); fs.appendFileSync(path.join(d, "README.md"), "x\n"); },
    3,
    ["BAD_ENTRY"],
    { stage: false },
  ],
  [
    "a mode change to 100755",
    (d) => { bump(d); fs.chmodSync(path.join(d, "public/repo-facts.json"), 0o755); git(d, "add", "-A"); },
    3,
    ["BAD_ENTRY"],
    { stage: false },
  ],
  [
    "a mode change to 100755 that only the index records",
    (d) => { bump(d); git(d, "add", "-A"); git(d, "update-index", "--chmod=+x", "public/repo-facts.json"); },
    3,
    ["BAD_ENTRY"],
    { stage: false },
  ],
  [
    "a feed replaced by a symlink",
    (d) => {
      bump(d);
      fs.rmSync(path.join(d, "public/repo-facts.json"));
      fs.symlinkSync("tool-versions.json", path.join(d, "public/repo-facts.json"));
    },
    3,
    ["BAD_ENTRY"],
  ],
  ["a deleted allowlisted file", (d) => { bump(d); fs.rmSync(path.join(d, "public/repo-facts.json")); }, 3, ["BAD_ENTRY"]],
  [
    "a workflow file added",
    (d) => {
      bump(d);
      fs.mkdirSync(path.join(d, ".github/workflows"), { recursive: true });
      fs.writeFileSync(path.join(d, ".github/workflows/x.yml"), "on: push\n");
    },
    3,
    ["BAD_ENTRY", "PATH_NOT_ALLOWED"],
  ],

  // --- check 2: canonical bytes
  [
    "a js banner comment edited",
    (d) => rawEdit(d, "src/data/castStats.js", (t) => t.replace("do not edit manually", "do edit manually")),
    3,
    ["JS_NOT_CANONICAL"],
  ],
  [
    "a js module with smuggled code",
    (d) => rawEdit(d, "src/data/toolStats.js", (t) => `${t}\nfetch("https://x.test");\n`),
    3,
    ["JS_NOT_CANONICAL"],
  ],
  ["a js module that no longer parses", (d) => rawEdit(d, "src/data/toolStats.js", (t) => `${t}export const X = 5;\n`), 3, ["JS_NOT_CANONICAL"]],
  [
    "a json key reorder",
    (d) => ed(d, "public/tool-versions.json", (v) => Object.fromEntries(Object.entries(v).reverse())),
    3,
    ["JSON_NOT_CANONICAL"],
  ],
  [
    "a json nested key reorder",
    (d) => ed(d, "public/repo-facts.json", (v) => ({ computeAtlas: Object.fromEntries(Object.entries(v.computeAtlas).reverse()) })),
    3,
    ["JSON_NOT_CANONICAL"],
  ],
  ["a json reformatted compact", (d) => ed(d, "public/repo-facts.json", () => {}) || rawEdit(d, "public/repo-facts.json", (t) => JSON.stringify(JSON.parse(t))), 3, ["JSON_NOT_CANONICAL"]],
  [
    "a js key reorder",
    (d) => ed(d, "src/data/toolStats.js", (m) => { m.TOOL_VERSIONS = Object.fromEntries(Object.entries(m.TOOL_VERSIONS).reverse()); }),
    3,
    ["JS_NOT_CANONICAL"],
  ],
  ["a json file that no longer parses", (d) => rawEdit(d, "public/tool-versions.json", (t) => `${t}}`), 3, ["JSON_NOT_CANONICAL"]],
  [
    "a json __proto__ key",
    (d) => rawEdit(d, "public/repo-facts.json", (t) => t.replace('"routeHandlers"', '"__proto__": {"x": 1},\n    "routeHandlers"')),
    3,
    ["JSON_NOT_CANONICAL"],
  ],

  // --- check 3: schema
  ["an added key", (d) => ed(d, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.extra = 1; }), 3, ["SCHEMA"]],
  ["a removed key", (d) => ed(d, "public/cast-stats.json", (v) => { delete v._generator; }), 3, ["SCHEMA"]],
  ["a changed JSON type", (d) => ed(d, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.states = "50"; }), 3, ["SCHEMA"]],
  ["a negative number", (d) => ed(d, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.states = -1; }), 3, ["SCHEMA"]],
  ["an array length change", (d) => ed(d, "public/atlas-stats.json", (v) => { v.stateCodes.pop(); }), 3, ["SCHEMA"]],
  ["ATLAS_STATS.stack edited", (d) => ed(d, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.stack += " · Rust"; }), 3, ["STRING_CHANGED"]],
  ["a stateCodes element edited", (d) => ed(d, "public/atlas-stats.json", (v) => { v.stateCodes[0] = "ZZ"; }), 3, ["STRING_CHANGED"]],
  ["a changed _source string", (d) => ed(d, "public/cast-stats.json", (v) => { v._source = "https://evil.test/x"; }), 3, ["STRING_CHANGED"]],

  // --- check 4: bounds
  [
    "tests more than doubled",
    (d) => {
      ed(d, "public/cast-stats.json", (v) => { v.tests *= 2; });
      ed(d, "src/data/castStats.js", (m) => { m.CAST_STATS.tests *= 2; });
    },
    3,
    ["BOUND_TESTS"],
  ],
  ["test_files halved", (d) => ed(d, "public/cast-stats.json", (v) => { v.test_files = Math.floor(v.test_files / 2); }), 3, ["BOUND_TESTS"]],
  [
    "commits go down",
    (d) => {
      ed(d, "public/repo-facts.json", (v) => { v.computeAtlas.commits -= 5; });
      ed(d, "src/data/repoFacts.js", (m) => { m.REPO_FACTS.computeAtlas.commits -= 5; });
    },
    3,
    ["BOUND_MONOTONIC"],
  ],
  [
    "claudeCoauthored above commits",
    (d) => ed(d, "public/repo-facts.json", (v) => { v.computeAtlas.claudeCoauthored = v.computeAtlas.commits + 1; }),
    3,
    ["BOUND_MONOTONIC"],
  ],
  [
    "honest repo-facts growth",
    (d) => {
      ed(d, "public/repo-facts.json", (v) => { v.computeAtlas.commits += 3; v.computeAtlas.claudeCoauthored += 2; });
      ed(d, "src/data/repoFacts.js", (m) => { m.REPO_FACTS.computeAtlas.commits += 3; m.REPO_FACTS.computeAtlas.claudeCoauthored += 2; });
    },
    0,
    [],
  ],
  ["a big number jump", (d) => ed(d, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.states = 80; }), 3, ["BOUND_NUMBER"]],
  ["a small number jump", (d) => ed(d, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.territories = 20; }), 3, ["BOUND_NUMBER"]],
  ["atlas-points w changed", (d) => ed(d, "public/atlas-points.json", (v) => { v.w += 1; }), 3, ["BOUND_NUMBER"]],
  ["ATLAS_POINTS.h changed", (d) => ed(d, "src/data/atlasPoints.js", (m) => { m.ATLAS_POINTS.h += 1; }), 3, ["BOUND_NUMBER"]],
  ["a version jumping two majors", (d) => ed(d, "public/tool-versions.json", (v) => { v.attest = "v2.0.0"; }), 3, ["VERSION"]],
  ["a version going down", (d) => ed(d, "src/data/toolStats.js", (m) => { m.TOOL_VERSIONS.misfire = "v0.1.9"; }), 3, ["VERSION"]],
  ["a version losing its v prefix", (d) => ed(d, "public/tool-versions.json", (v) => { v.attest = "0.3.1"; }), 3, ["VERSION"]],
  ["a version that is not a version", (d) => ed(d, "public/tool-versions.json", (v) => { v.attest = "latest"; }), 3, ["VERSION"]],
  ["edition.version without a v bumped", (d) => ed(d, "public/atlas-stats.json", (v) => { v.edition.version = "1.34.2"; }), 0, []],
  ["a major +1 version", (d) => ed(d, "src/data/castStats.js", (m) => { m.CAST_STATS.version = "v11.0.0"; }), 0, []],
  ["a date in the future", (d) => { bump(d); ed(d, "public/atlas-points.json", (v) => { v.asOf = "2099-01-01"; }); }, 3, ["DATE"]],
  ["a date going backwards", (d) => { bump(d); ed(d, "src/data/castStats.js", (m) => { m.CAST_STATS.updated = "2026-01-01"; }); }, 3, ["DATE"]],
  ["a date changing shape", (d) => { bump(d); ed(d, "public/cast-stats.json", (v) => { v.updated = "2026-10-16T00:00:00Z"; }); }, 3, ["DATE"]],
  ["an impossible date", (d) => { bump(d); ed(d, "public/atlas-points.json", (v) => { v.asOf = "2026-02-31"; }); }, 3, ["DATE"]],
  ["pts of the wrong length", (d) => ed(d, "public/atlas-points.json", (v) => { v.pts.length -= 3; }), 3, ["POINTS"]],
  ["a point with an unknown status", (d) => ed(d, "public/atlas-points.json", (v) => { v.pts[2] = 99; }), 3, ["POINTS"]],
  ["a non-integer point", (d) => ed(d, "public/atlas-points.json", (v) => { v.pts[0] = 1.5; }), 3, ["POINTS"]],
  ["a point outside the canvas", (d) => ed(d, "public/atlas-points.json", (v) => { v.pts[0] = v.w + 1; }), 3, ["POINTS"]],
  ["byStatus that no longer sums", (d) => ed(d, "src/data/atlasPoints.js", (m) => { m.ATLAS_POINTS.byStatus.operational += 1; }), 3, ["POINTS"]],
  [
    "byStatus with a new key",
    (d) => ed(d, "src/data/atlasPoints.js", (m) => { m.ATLAS_POINTS.byStatus = { ...m.ATLAS_POINTS.byStatus, other: 0 }; }),
    3,
    ["POINTS"],
  ],

  [
    "a last-known-commits change is no longer on the allowlist",
    (d) => { bump(d); ed(d, "public/last-known-commits.json", (v) => { v.commits.pop(); }); },
    3,
    ["PATH_NOT_ALLOWED"],
  ],
  ["a version with a prerelease suffix", (d) => ed(d, "public/tool-versions.json", (v) => { v.attest = "v0.3.1-rc.1"; }), 3, ["VERSION"]],
  ["a flipped boolean", (d) => ed(d, "public/atlas-stats.json", (v) => { v.includesDc = !v.includesDc; }), 3, ["STRING_CHANGED"]],
  [
    "byStatus reshuffled with the same total",
    (d) => ed(d, "src/data/atlasPoints.js", (m) => { m.ATLAS_POINTS.byStatus.operational -= 300; m.ATLAS_POINTS.byStatus.cancelled += 300; }),
    3,
    ["POINTS"],
  ],
  ["ATLAS_POINTS.count moved away from the point list", (d) => ed(d, "src/data/atlasPoints.js", (m) => { m.ATLAS_POINTS.count = 2500; }), 3, ["POINTS"]],
  [
    "atlas-points count and pts moved together with a stale byStatus",
    (d) => ed(d, "public/atlas-points.json", (v) => { v.pts.length -= 3; v.count -= 1; }),
    3,
    ["POINTS"],
  ],
  ["a PDF change on top of a feed change", (d) => { bump(d); pdfEdit(d, RESUME, (s) => s.replace(/(\/CreationDate \(D:2026)\d/, (_, a) => `${a}9`)); }, 3, ["PATH_NOT_ALLOWED"]],
  ["a PDF-only change", (d) => pdfEdit(d, ONEPAGER, (s) => `${s}%\n`), 3, ["PATH_NOT_ALLOWED"]],
];

describe("gate", () => {
  it.each(CASES)("%s", (_name, mutate, status, codes, opts) => {
    const dir = freshRepo();
    mutate(dir);
    expectResult(run(dir, opts), status, codes);
  });
});

describe("gate CLI contract", () => {
  it("prints nothing on stdout and puts the verdict in the file", () => {
    const dir = freshRepo();
    bump(dir);
    const r = run(dir);
    expect(r.stdout).toBe("");
    expect(r.verdict.changed.sort()).toEqual(["public/tool-versions.json", "src/data/toolStats.js"]);
  });

  it("removes a stale verdict file even when the run then errors", () => {
    const dir = freshRepo();
    const verdictFile = path.join(dir, "..", `stale-${path.basename(dir)}.json`);
    cleanups.push(() => fs.rmSync(verdictFile, { force: true }));
    fs.writeFileSync(verdictFile, '{"verdict":"eligible","reasons":[],"changed":[]}');
    git(dir, "add", "-A"); // nothing staged -> error
    const r = spawnSync("node", [script, "gate", "--repo", dir, "--verdict", verdictFile], { env: GIT_ENV, encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(fs.existsSync(verdictFile)).toBe(false);
  });

  it("exits 1 with no verdict outside a git repo", () => {
    const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "refresh-gate-nogit-")));
    cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
    const verdictFile = path.join(dir, "v.json");
    const r = spawnSync("node", [script, "gate", "--repo", dir, "--verdict", verdictFile], {
      env: { ...GIT_ENV, GIT_CEILING_DIRECTORIES: path.dirname(dir) },
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    expect(fs.existsSync(verdictFile)).toBe(false);
  });

  it("exits 2 without --repo or --verdict", () => {
    for (const args of [["gate"], ["gate", "--repo", "."], ["gate", "--verdict", "v.json"]]) {
      expect(spawnSync("node", [script, ...args], { env: GIT_ENV }).status).toBe(2);
    }
  });

  it("collects every reason, not just the first", () => {
    const dir = freshRepo();
    bump(dir);
    fs.appendFileSync(path.join(dir, "README.md"), "x\n");
    ed(dir, "src/data/atlasStats.js", (m) => { m.ATLAS_STATS.stack += "!"; });
    const r = run(dir);
    expect(r.codes).toEqual(["PATH_NOT_ALLOWED", "STRING_CHANGED"]);
  });

  it("sanitizes attacker-influenced path and detail text", () => {
    const dir = freshRepo();
    bump(dir);
    fs.writeFileSync(path.join(dir, "a`b<c>d.txt"), "x");
    fs.writeFileSync(path.join(dir, `${"long".repeat(60)}.txt`), "x");
    const r = run(dir);
    expect(r.codes).toEqual(["BAD_ENTRY", "PATH_NOT_ALLOWED"]);
    const texts = [...r.verdict.reasons.flatMap((x) => [x.path, x.detail]), ...r.verdict.changed];
    for (const t of texts) {
      // eslint-disable-next-line no-control-regex
      expect(t).not.toMatch(/[`<>\u0000-\u001f\u2028\u2029]/);
      expect(t.length).toBeLessThanOrEqual(160);
    }
    expect(r.verdict.reasons.some((x) => x.path === "abcd.txt")).toBe(true);
  });

  it("sanitizes a string pulled from a feed into the detail", () => {
    const dir = freshRepo();
    const evil = `<script>\`x\`@evil${String.fromCharCode(0x2028, 0x202e, 0x200b, 0xfeff)}`;
    ed(dir, "public/cast-stats.json", (v) => { v._source = evil; });
    const r = run(dir);
    expect(r.codes).toEqual(["STRING_CHANGED"]);
    const detail = r.verdict.reasons[0].detail;
    expect(detail).toContain("(at)evil");
    expect(detail).not.toMatch(/[`<>@]/);
    expect(detail).toBe(detail.replace(/[\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, ""));
  });
});

describe("gate reason cap", () => {
  const blow = (x) =>
    typeof x === "number" ? x * 100 + 11 : typeof x === "string" ? `${x}!` : Array.isArray(x) ? x.map(blow) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, blow(v)])) : x;

  it("caps data reasons but never drops a structural one", () => {
    const dir = freshRepo();
    for (const f of FEEDS) {
      if (f.path === "public/atlas-points.json") continue;
      ed(dir, f.path, f.kind === "js" ? (m) => { for (const k of Object.keys(m)) m[k] = blow(m[k]); } : (v) => blow(v));
    }
    rawEdit(dir, "src/data/atlasPoints.js", (t) => t.replace("do not edit manually", "do edit manually"));
    // The last feed processed: its structural code arrives after the data reasons filled the cap.
    rawEdit(dir, "public/atlas-points.json", (t) => JSON.stringify(JSON.parse(t), null, 2));
    const r = run(dir);
    expect(r.status).toBe(3);
    expect(r.codes).toContain("JS_NOT_CANONICAL");
    expect(r.codes).toContain("JSON_NOT_CANONICAL");
    expect(r.verdict.dropped).toBeGreaterThan(0);
    const structural = new Set(["BAD_ENTRY", "PATH_NOT_ALLOWED", "JS_NOT_CANONICAL", "JSON_NOT_CANONICAL"]);
    expect(r.verdict.reasons.filter((x) => !structural.has(x.code))).toHaveLength(100);
  });

  it("reports dropped: 0 normally", () => {
    const dir = freshRepo();
    bump(dir);
    expect(run(dir).verdict.dropped).toBe(0);
  });
});
