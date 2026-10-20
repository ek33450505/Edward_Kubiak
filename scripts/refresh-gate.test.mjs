import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import { FEEDS, ALLOWLIST, materialCheck } from "./refresh-gate.mjs";
import { parseDataModule, renderDataModule, jsonStyleOf, renderJsonLike } from "./lib/data-module.mjs";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const script = path.join(repo, "scripts", "refresh-gate.mjs");
const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
const cleanups = [];

afterEach(() => {
  while (cleanups.length) cleanups.pop()();
});

function git(dir, ...args) {
  return execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], {
    env: GIT_ENV,
    encoding: "utf8",
  });
}

// realpath: macOS tmpdir is a /var -> /private/var symlink.
function makeRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "refresh-gate-")));
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const f of FEEDS.filter((x) => x.kind !== "pdf")) {
    fs.mkdirSync(path.dirname(path.join(dir, f.path)), { recursive: true });
    fs.copyFileSync(path.join(repo, f.path), path.join(dir, f.path));
  }
  fs.writeFileSync(path.join(dir, "README.md"), "# readme\n");
  git(dir, "init", "-q");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "fixture");
  return dir;
}

function editFeed(dir, relPath, mutate) {
  const abs = path.join(dir, relPath);
  const text = fs.readFileSync(abs, "utf8");
  if (relPath.endsWith(".js")) {
    const { segments, exports } = parseDataModule(text);
    mutate(Object.fromEntries(exports.map((e) => [e.name, e.value])));
    fs.writeFileSync(abs, renderDataModule(segments, exports));
  } else {
    const value = JSON.parse(text);
    mutate(value);
    fs.writeFileSync(abs, renderJsonLike(value, jsonStyleOf(text)));
  }
}

describe("FEEDS / ALLOWLIST", () => {
  it("lists the 13 allowlisted paths", () => {
    expect(ALLOWLIST).toHaveLength(13);
    expect(new Set(ALLOWLIST).size).toBe(13);
    expect(FEEDS.filter((f) => f.pdf).map((f) => f.path)).toEqual([
      "src/data/castStats.js",
      "src/data/atlasStats.js",
      "src/data/toolStats.js",
    ]);
  });
});

describe("materialCheck", () => {
  it("clean tree is not material", () => {
    expect(materialCheck(makeRepo())).toEqual({ material: false, pdfs: false, changed: [] });
  });

  it("moving only ignored date keys is not material", () => {
    const dir = makeRepo();
    editFeed(dir, "src/data/castStats.js", (m) => { m.CAST_STATS.updated = "2099-01-01"; });
    editFeed(dir, "src/data/atlasPoints.js", (m) => { m.ATLAS_POINTS.asOf = "2099-01-01"; });
    editFeed(dir, "src/data/repoFacts.js", (m) => {
      m.REPO_FACTS.computeAtlas.treeAsOf = "2099-01-01";
      m.REPO_FACTS.computeAtlas.commitsAsOf = "2099-01-01";
    });
    editFeed(dir, "public/cast-stats.json", (v) => { v.updated = "2099-01-01"; });
    editFeed(dir, "public/atlas-stats.json", (v) => { v.edition.asOf = "2099-01-01T00:00:00.000Z"; });
    editFeed(dir, "public/repo-facts.json", (v) => { v.computeAtlas.treeAsOf = "2099-01-01"; });
    editFeed(dir, "public/atlas-points.json", (v) => { v.asOf = "2099-01-01"; });
    editFeed(dir, "public/last-known-commits.json", (v) => { v.cachedAt = "2099-01-01T00:00:00.000Z"; });
    expect(git(dir, "status", "--porcelain")).not.toBe("");
    expect(materialCheck(dir).material).toBe(false);
  });

  it("a last-known-commits change alone is not material", () => {
    const dir = makeRepo();
    editFeed(dir, "public/last-known-commits.json", (v) => { v.commits.pop(); });
    const r = materialCheck(dir);
    expect(r.material).toBe(false);
    expect(r.changed.map((c) => c.path)).toEqual(["public/last-known-commits.json"]);
  });

  it("a tool version bump is material and feeds the PDFs", () => {
    const dir = makeRepo();
    editFeed(dir, "src/data/toolStats.js", (m) => { m.TOOL_VERSIONS.attest = "v9.9.9"; });
    editFeed(dir, "public/tool-versions.json", (v) => { v.attest = "v9.9.9"; });
    const r = materialCheck(dir);
    expect(r.material).toBe(true);
    expect(r.pdfs).toBe(true);
  });

  it("a repoFacts change is material but does not feed the PDFs", () => {
    const dir = makeRepo();
    editFeed(dir, "src/data/repoFacts.js", (m) => { m.REPO_FACTS.computeAtlas.testFiles += 1; });
    expect(materialCheck(dir)).toMatchObject({ material: true, pdfs: false });
  });

  it("a stray untracked file is material (outside allowlist)", () => {
    const dir = makeRepo();
    fs.mkdirSync(path.join(dir, "scripts"));
    fs.writeFileSync(path.join(dir, "scripts", "evil.mjs"), "x");
    const r = materialCheck(dir);
    expect(r.material).toBe(true);
    expect(r.changed).toContainEqual({ path: "scripts/evil.mjs", reason: "outside allowlist" });
  });

  it("a modified README is material (outside allowlist)", () => {
    const dir = makeRepo();
    fs.appendFileSync(path.join(dir, "README.md"), "more\n");
    expect(materialCheck(dir).changed).toContainEqual({ path: "README.md", reason: "outside allowlist" });
  });

  it("a PDF change alone is not material", () => {
    const dir = makeRepo();
    fs.mkdirSync(path.join(dir, "public"), { recursive: true });
    fs.writeFileSync(path.join(dir, "public/Edward_Kubiak_Resume.pdf"), "%PDF");
    expect(materialCheck(dir).material).toBe(false);
  });

  it("a missing feed is material", () => {
    const dir = makeRepo();
    fs.rmSync(path.join(dir, "public/tool-versions.json"));
    expect(materialCheck(dir).changed).toContainEqual({ path: "public/tool-versions.json", reason: "missing" });
    expect(materialCheck(dir).material).toBe(true);
  });

  it("throws on an unparseable HEAD file", () => {
    const dir = makeRepo();
    fs.writeFileSync(path.join(dir, "public/tool-versions.json"), "garbage");
    git(dir, "commit", "-q", "-am", "garbage");
    expect(() => materialCheck(dir)).toThrow(/HEAD:public\/tool-versions\.json/);
  });

  it("throws on an unparseable working-tree file", () => {
    const dir = makeRepo();
    fs.writeFileSync(path.join(dir, "src/data/toolStats.js"), "not a module");
    expect(() => materialCheck(dir)).toThrow(/src\/data\/toolStats\.js/);
  });
});

describe("materialCheck anomalies", () => {
  const append = (dir, rel, text) => fs.appendFileSync(path.join(dir, rel), text);

  it.each([
    ["an extra uppercase export", '\nexport const DEBUG_NOTE = {\n  "a": 1\n};\n'],
    ["an extra lowercase export", '\nexport const debugNote = {"a": 1};\n'],
    ["a trailing statement", "\nglobalThis.injected = 1;\n"],
  ])("%s in a js feed is material (non-canonical module)", (_label, extra) => {
    const dir = makeRepo();
    append(dir, "src/data/toolStats.js", extra);
    const r = materialCheck(dir);
    expect(r.material).toBe(true);
    expect(r.changed).toContainEqual({ path: "src/data/toolStats.js", reason: "non-canonical module" });
  });

  it("a changed banner comment is material (non-canonical module)", () => {
    const dir = makeRepo();
    const p = path.join(dir, "src/data/toolStats.js");
    fs.writeFileSync(p, `// sneaky\n${fs.readFileSync(p, "utf8")}`);
    expect(materialCheck(dir).changed).toContainEqual({ path: "src/data/toolStats.js", reason: "non-canonical module" });
  });

  it("a duplicated export block throws", () => {
    const dir = makeRepo();
    const p = path.join(dir, "src/data/toolStats.js");
    const text = fs.readFileSync(p, "utf8");
    fs.writeFileSync(p, text + text.slice(text.indexOf("export const")));
    expect(() => materialCheck(dir)).toThrow(/duplicate export/);
  });

  it("a symlinked feed throws", () => {
    const dir = makeRepo();
    const p = path.join(dir, "public/tool-versions.json");
    fs.copyFileSync(p, `${p}.real`);
    fs.rmSync(p);
    fs.symlinkSync(`${p}.real`, p);
    expect(() => materialCheck(dir)).toThrow(/public\/tool-versions\.json is not a regular file/);
  });

  it("a key-order-only change is not material (deepEqual ignores order)", () => {
    const dir = makeRepo();
    editFeed(dir, "public/tool-versions.json", (v) => {
      const entries = Object.entries(v).reverse();
      for (const k of Object.keys(v)) delete v[k];
      for (const [k, val] of entries) v[k] = val;
    });
    expect(git(dir, "status", "--porcelain")).not.toBe("");
    expect(materialCheck(dir).material).toBe(false);
  });

  it("reports both paths of a rename", () => {
    const dir = makeRepo();
    git(dir, "mv", "README.md", "README2.md");
    const paths = materialCheck(dir).changed.map((c) => c.path);
    expect(paths).toEqual(expect.arrayContaining(["README.md", "README2.md"]));
  });

  it("handles a path containing a space", () => {
    const dir = makeRepo();
    fs.writeFileSync(path.join(dir, "my notes.txt"), "x");
    expect(materialCheck(dir).changed).toContainEqual({ path: "my notes.txt", reason: "outside allowlist" });
  });
});

describe("CLI", () => {
  const run = (...args) => spawnSync("node", [script, ...args], { encoding: "utf8", env: GIT_ENV });

  it("prints exactly the two output lines", () => {
    const dir = makeRepo();
    editFeed(dir, "src/data/toolStats.js", (m) => { m.TOOL_VERSIONS.attest = "v9.9.9"; });
    const r = run("material", "--repo", dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("material=true\npdfs=true\n");
    expect(r.stderr).toContain("src/data/toolStats.js");
  });

  it("prints false/false on a clean tree", () => {
    const r = run("material", "--repo", makeRepo());
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("material=false\npdfs=false\n");
  });

  it("exits 1 with empty stdout on error", () => {
    const dir = makeRepo();
    fs.writeFileSync(path.join(dir, "src/data/toolStats.js"), "not a module");
    const r = run("material", "--repo", dir);
    expect(r.status).toBe(1);
    expect(r.stdout).toBe("");
    expect(r.stderr).not.toBe("");
  });

  it("exits 1 with empty stdout on a duplicated export block", () => {
    const dir = makeRepo();
    const p = path.join(dir, "src/data/toolStats.js");
    const text = fs.readFileSync(p, "utf8");
    fs.writeFileSync(p, text + text.slice(text.indexOf("export const")));
    const r = run("material", "--repo", dir);
    expect(r.status).toBe(1);
    expect(r.stdout).toBe("");
  });

  it("exits 2 on an unknown subcommand or a missing --repo", () => {
    expect(run("bogus", "--repo", ".").status).toBe(2);
    expect(run("material").status).toBe(2);
    expect(run("material").stdout).toBe("");
  });
});
