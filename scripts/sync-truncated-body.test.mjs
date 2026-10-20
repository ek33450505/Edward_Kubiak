// Process-level guard: a feed that promises a body and then drops the socket must
// leave each sync script exiting 0 with its committed snapshot untouched. Before the
// shared fetch-json helper, such a body never settled and Node exited 13 (which fails
// the `prebuild` && chain and so `npm run build`).
//
// Each script runs from a temp copy of the project skeleton, so a test can never
// modify tracked files.
import { describe, it, expect, afterEach } from "vitest";
import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cleanups = [];

afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

function startTruncatingServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json", "Content-Length": 5000 });
      res.write('{"partial":');
      setTimeout(() => res.socket.destroy(), 20);
    });
    server.listen(0, "127.0.0.1", () => {
      cleanups.push(() => new Promise((r) => server.close(r)));
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

function makeProject(script, snapshot) {
  // realpath: the scripts compare import.meta.url with argv[1], which differs under macOS /var -> /private/var.
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "sync-trunc-")));
  cleanups.push(async () => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "scripts", "lib"), { recursive: true });
  fs.mkdirSync(path.join(dir, "public"));
  fs.mkdirSync(path.join(dir, "src", "data"), { recursive: true });
  fs.copyFileSync(path.join(repo, "scripts", script), path.join(dir, "scripts", script));
  for (const lib of ["fetch-json.mjs", "github.mjs", "data-module.mjs", "direct-invocation.mjs"]) {
    fs.copyFileSync(path.join(repo, "scripts", "lib", lib), path.join(dir, "scripts", "lib", lib));
  }
  fs.copyFileSync(path.join(repo, "public", snapshot), path.join(dir, "public", snapshot));
  return dir;
}

const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function run(dir, script, env) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(dir, "scripts", script)],
      { cwd: dir, env: { ...process.env, HOME: dir, GITHUB_TOKEN: "", ...env }, timeout: 30000 },
      (err, stdout, stderr) => resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr }),
    );
  });
}

describe.each([
  { script: "sync-cast-stats.mjs", snapshot: "cast-stats.json", envVar: "CAST_STATS_URL", out: "castStats.js" },
  { script: "sync-atlas-stats.mjs", snapshot: "atlas-stats.json", envVar: "ATLAS_STATS_URL", out: "atlasStats.js" },
  {
    script: "sync-tool-versions.mjs",
    snapshot: "tool-versions.json",
    envVar: "TOOL_VERSIONS_API_BASE",
    out: "toolStats.js",
  },
])("$script against a truncated body", ({ script, snapshot, envVar, out }) => {
  it("exits 0 and leaves the committed snapshot byte-identical", async () => {
    const url = await startTruncatingServer();
    const dir = makeProject(script, snapshot);
    const before = sha(path.join(dir, "public", snapshot));
    expect(before).toBe(sha(path.join(repo, "public", snapshot)));

    const { code, stderr } = await run(dir, script, { [envVar]: url });

    expect(code, stderr).toBe(0);
    expect(sha(path.join(dir, "public", snapshot))).toBe(before);
    expect(fs.existsSync(path.join(dir, "src", "data", out))).toBe(true);
  }, 40000);
});
