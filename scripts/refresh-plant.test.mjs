import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import { FEEDS, materialCheck } from "./refresh-gate.mjs";
import { plant, KINDS } from "./refresh-plant.mjs";
import { parseDataModule, renderDataModule } from "./lib/data-module.mjs";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const script = path.join(repo, "scripts", "refresh-plant.mjs");
const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
const cleanups = [];

// `quiet` stamps the current date, so pin it far from whatever the fixture feeds carry: otherwise a
// tree already synced (or planted) today makes the plant a no-op and the date assertions flake.
const PINNED_DAY = "2030-06-15";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(`${PINNED_DAY}T12:00:00Z`), toFake: ["Date"] });
});

afterEach(() => {
  vi.useRealTimers();
  while (cleanups.length) cleanups.pop()();
});

function git(dir, ...args) {
  return execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], {
    env: GIT_ENV,
    encoding: "utf8",
  });
}

function makeRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "refresh-plant-")));
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const f of FEEDS) {
    fs.mkdirSync(path.dirname(path.join(dir, f.path)), { recursive: true });
    fs.copyFileSync(path.join(repo, f.path), path.join(dir, f.path));
  }
  fs.writeFileSync(path.join(dir, "README.md"), "# readme\n");
  git(dir, "init", "-q");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "fixture");
  return dir;
}

const read = (dir, p) => fs.readFileSync(path.join(dir, p), "utf8");

describe("plant", () => {
  it("quiet moves only ignored dates (material=false) but does change files", () => {
    const dir = makeRepo();
    plant("quiet", dir);
    expect(git(dir, "status", "--porcelain")).not.toBe("");
    expect(materialCheck(dir)).toMatchObject({ material: false });
    expect(JSON.parse(read(dir, "public/atlas-points.json")).asOf).toBe(PINNED_DAY);
  });

  it("feed-only bumps the first tool patch in both mirrors", () => {
    const dir = makeRepo();
    plant("feed-only", dir);
    expect(materialCheck(dir)).toMatchObject({ material: true });
    const before = JSON.parse(git(dir, "show", "HEAD:public/tool-versions.json"));
    const after = JSON.parse(read(dir, "public/tool-versions.json"));
    const first = Object.keys(before)[0];
    const [maj, min, patch] = before[first].replace(/^v/, "").split(".").map(Number);
    expect(after[first]).toBe(`v${maj}.${min}.${patch + 1}`);
    expect(read(dir, "src/data/toolStats.js")).toContain(`"${first}": "${after[first]}"`);
  });

  it("feed-plus-prose also appends the probe line to README.md", () => {
    const dir = makeRepo();
    plant("feed-plus-prose", dir);
    expect(read(dir, "README.md")).toBe("# readme\n<!-- weekly-refresh probe -->\n");
    const r = materialCheck(dir);
    expect(r.material).toBe(true);
    expect(r.changed).toContainEqual({ path: "README.md", reason: "outside allowlist" });
  });

  it("facilities-drop halves the facility count in both mirrors", () => {
    const dir = makeRepo();
    const before = JSON.parse(read(dir, "public/atlas-stats.json")).count;
    plant("facilities-drop", dir);
    expect(materialCheck(dir)).toMatchObject({ material: true });
    expect(JSON.parse(read(dir, "public/atlas-stats.json")).count).toBe(Math.floor(before / 2));
    const m = parseDataModule(read(dir, "src/data/atlasStats.js"));
    expect(m.exports.find((e) => e.name === "ATLAS_STATS").value.facilities).toBe(Math.floor(before / 2));
  });

  it.each(KINDS)("%s leaves planted js modules round-tripping", (kind) => {
    const dir = makeRepo();
    plant(kind, dir);
    for (const f of FEEDS.filter((x) => x.kind === "js")) {
      const text = read(dir, f.path);
      const p = parseDataModule(text);
      expect(renderDataModule(p.segments, p.exports)).toBe(text);
    }
  });

  it.each(KINDS)("%s is deterministic: planting twice gives byte-identical files", (kind) => {
    const dir = makeRepo();
    const files = [...FEEDS.map((f) => f.path), "README.md"];
    plant(kind, dir);
    const once = files.map((f) => read(dir, f));
    plant(kind, dir);
    expect(files.map((f) => read(dir, f))).toEqual(once);
  });

  it("resets a pre-existing sync-like change before planting", () => {
    const dir = makeRepo();
    const p = path.join(dir, "public/repo-facts.json");
    fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace('"testFiles": ', '"testFiles": 1'));
    plant("quiet", dir);
    expect(materialCheck(dir).material).toBe(false);
    plant("facilities-drop", dir);
    expect(read(dir, "public/repo-facts.json")).toBe(git(dir, "show", "HEAD:public/repo-facts.json"));
  });
});

describe("CLI", () => {
  it("exits 2 on an unknown kind without writing", () => {
    const dir = makeRepo();
    const r = spawnSync("node", [script, "bogus", "--repo", dir], { encoding: "utf8", env: GIT_ENV });
    expect(r.status).toBe(2);
    expect(git(dir, "status", "--porcelain")).toBe("");
  });

  it("plants via the command line", () => {
    const dir = makeRepo();
    const r = spawnSync("node", [script, "feed-only", "--repo", dir], { encoding: "utf8", env: GIT_ENV });
    expect(r.status).toBe(0);
    expect(materialCheck(dir).material).toBe(true);
  });
});
