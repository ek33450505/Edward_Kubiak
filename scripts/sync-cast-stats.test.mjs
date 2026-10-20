// sync-cast-stats desktop fallback: with no local cast-desktop clone, the desktop figures must
// come from the COMMITTED src/data/castStats.js, not the hard-coded constants. Each run uses a
// temp project skeleton, so tracked files are never touched.
import { describe, it, expect, afterEach } from "vitest";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cleanups = [];

afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

function makeProject(committed) {
  // realpath: the scripts compare import.meta.url with argv[1], which differs under macOS /var -> /private/var.
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "sync-cast-")));
  cleanups.push(async () => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "scripts", "lib"), { recursive: true });
  fs.mkdirSync(path.join(dir, "public"));
  fs.mkdirSync(path.join(dir, "src", "data"), { recursive: true });
  fs.copyFileSync(path.join(repo, "scripts", "sync-cast-stats.mjs"), path.join(dir, "scripts", "sync-cast-stats.mjs"));
  for (const lib of ["fetch-json.mjs", "data-module.mjs"]) {
    fs.copyFileSync(path.join(repo, "scripts", "lib", lib), path.join(dir, "scripts", "lib", lib));
  }
  fs.copyFileSync(path.join(repo, "public", "cast-stats.json"), path.join(dir, "public", "cast-stats.json"));
  if (committed !== null) fs.writeFileSync(path.join(dir, "src", "data", "castStats.js"), committed);
  return dir;
}

function committedModule(desktop) {
  return `// AUTO-GENERATED\n\nexport const CAST_STATS = {\n  "version": "v1.0.0"\n};\n\nexport const CAST_DESKTOP_STATS = ${JSON.stringify(desktop, null, 2)};\n`;
}

function addClone(dir) {
  const clone = path.join(dir, "Projects", "personal", "cast-desktop");
  const views = path.join(clone, "src", "dashboard", "views");
  fs.mkdirSync(views, { recursive: true });
  fs.writeFileSync(path.join(clone, "package.json"), JSON.stringify({ version: "2.0.0" }));
  for (const f of ["A.tsx", "B.tsx", "C.tsx", "A.test.tsx"]) fs.writeFileSync(path.join(views, f), "");
}

function run(dir) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(dir, "scripts", "sync-cast-stats.mjs")],
      {
        cwd: dir,
        env: { ...process.env, HOME: dir, CAST_STATS_URL: "http://127.0.0.1:9/" },
        timeout: 30000,
      },
      (err, stdout, stderr) => resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr }),
    );
  });
}

async function desktopAfter(dir) {
  const { code, stderr } = await run(dir);
  expect(code, stderr).toBe(0);
  const text = fs.readFileSync(path.join(dir, "src", "data", "castStats.js"), "utf8");
  const m = text.match(/export const CAST_DESKTOP_STATS = (\{[\s\S]*?\});/);
  return JSON.parse(m[1]);
}

describe("sync-cast-stats desktop figures", () => {
  it("keeps the committed values when there is no clone", async () => {
    const dir = makeProject(committedModule({ version: "v9.9.9", dashboardViews: 42 }));
    expect(await desktopAfter(dir)).toEqual({ version: "v9.9.9", dashboardViews: 42 });
  }, 40000);

  it("falls back to the hard-coded constants when castStats.js is missing", async () => {
    const dir = makeProject(null);
    expect(await desktopAfter(dir)).toEqual({ version: "v1.2.12", dashboardViews: 11 });
  }, 40000);

  it("falls back to the hard-coded constants when castStats.js is garbage", async () => {
    const dir = makeProject("not a module at all\n");
    expect(await desktopAfter(dir)).toEqual({ version: "v1.2.12", dashboardViews: 11 });
  }, 40000);

  it("rejects a bad committed version even when the view count is valid", async () => {
    const dir = makeProject(committedModule({ version: "9.9.9", dashboardViews: 42 }));
    expect(await desktopAfter(dir)).toEqual({ version: "v1.2.12", dashboardViews: 11 });
  }, 40000);

  it("rejects a bad committed view count even when the version is valid", async () => {
    for (const bad of [-1, 1.5]) {
      const dir = makeProject(committedModule({ version: "v9.9.9", dashboardViews: bad }));
      expect(await desktopAfter(dir)).toEqual({ version: "v1.2.12", dashboardViews: 11 });
    }
  }, 40000);

  it("lets a local clone override the committed values", async () => {
    const dir = makeProject(committedModule({ version: "v9.9.9", dashboardViews: 42 }));
    addClone(dir);
    expect(await desktopAfter(dir)).toEqual({ version: "v2.0.0", dashboardViews: 3 });
  }, 40000);
});
