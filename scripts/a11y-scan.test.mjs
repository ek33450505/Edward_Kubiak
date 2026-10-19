import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { parseArgs, isDirectInvocation } from "./a11y-scan.mjs";

describe("parseArgs", () => {
  it("accepts a normal invocation", () => {
    expect(parseArgs(["--dir", "d", "--routes", "/,/about", "--concurrency", "2"])).toMatchObject({
      dir: "d",
      routes: ["/", "/about"],
      concurrency: 2,
      keyboard: true,
    });
  });
  it("rejects an empty --routes so a typo cannot scan nothing and pass", () => {
    expect(() => parseArgs(["--dir", "d", "--routes", ""])).toThrow(/0 routes/);
    expect(() => parseArgs(["--dir", "d", "--routes", " , "])).toThrow(/0 routes/);
  });
  it("rejects --routes with no value", () => {
    expect(() => parseArgs(["--dir", "d", "--routes"])).toThrow(/--routes/);
  });
  it("rejects a bad --concurrency, a missing --dir and unknown flags", () => {
    expect(() => parseArgs(["--dir", "d", "--concurrency", "0"])).toThrow(/concurrency/);
    expect(() => parseArgs([])).toThrow(/--dir/);
    expect(() => parseArgs(["--dir", "d", "--bogus"])).toThrow(/Unknown/);
  });
});

describe("isDirectInvocation", () => {
  const script = path.resolve(import.meta.dirname, "a11y-scan.mjs");
  const scriptUrl = pathToFileURL(script).href;
  let tmp;
  let link;
  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "a11y-scan-guard-"));
    link = path.join(tmp, "link.mjs");
    fs.symlinkSync(script, link);
  });
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it("is true for the same path", () => {
    expect(isDirectInvocation(script, scriptUrl)).toBe(true);
  });
  it("is true through a symlink", () => {
    expect(isDirectInvocation(link, scriptUrl)).toBe(true);
  });
  it("is false for a different file", () => {
    expect(isDirectInvocation(path.resolve(import.meta.dirname, "a11y-scan.test.mjs"), scriptUrl)).toBe(false);
  });
  it("is false for undefined or a missing path", () => {
    expect(isDirectInvocation(undefined, scriptUrl)).toBe(false);
    expect(isDirectInvocation(path.join(tmp, "nope.mjs"), scriptUrl)).toBe(false);
  });
  it("runs main() when launched through a symlink (harness error exits 2, not a silent 0)", () => {
    const r = spawnSync(process.execPath, [link, "--dir", "/nonexistent"], { encoding: "utf8" });
    expect(r.status).toBe(2);
  });
});
