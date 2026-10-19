import { afterAll, afterEach, beforeAll, describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { pathToFileURL } from "url";
import sharp from "sharp";
import * as tokens from "../src/lib/tokens.js";
import { escapeXml, generateOgSvg, headlineSize, isDirectInvocation } from "./generate-og-image.mjs";

// import.meta.url is not a file: URL under the jsdom test environment, so resolve from the repo root.
const GENERATOR = path.resolve(process.cwd(), "scripts/generate-og-image.mjs");
const GENERATOR_URL = pathToFileURL(GENERATOR).href;

const tempDirs = [];
const makeTempDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "og-test-"));
  tempDirs.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

// A timeout surfaces as result.error (status null), so callers assert both.
const spawnNode = (args) => spawnSync(process.execPath, args, { encoding: "utf8", timeout: 60_000 });
const runGenerator = (args) => spawnNode([GENERATOR, ...args]);
const expectSuccess = (result) => {
  expect(result.error, String(result.error)).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
};

// The CLI tests must never write into the repo's real public/og/.
const REPO_OG_DIR = path.resolve(process.cwd(), "public/og");
const snapshotDir = (dir) =>
  fs.existsSync(dir) ? Object.fromEntries(fs.readdirSync(dir).map((n) => [n, fs.statSync(path.join(dir, n)).mtimeMs])) : {};
let ogSnapshot;
beforeAll(() => {
  ogSnapshot = snapshotDir(REPO_OG_DIR);
});
afterAll(() => {
  const after = snapshotDir(REPO_OG_DIR);
  const touched = Object.keys({ ...ogSnapshot, ...after }).filter((n) => ogSnapshot[n] !== after[n]);
  expect(touched, `public/og/ was modified by the tests: ${touched.join(", ")}`).toEqual([]);
});

const NIGHT_SURVEY = ["#181410", "#4A4030", "#8FB98A", "#EDE6D6", "#B3A68C", "#211C16"];

describe("generate-og-image", () => {
  it("declares a 1200x630 canvas", () => {
    const svg = generateOgSvg("Edward Kubiak");
    expect(svg).toMatch(/<svg[^>]*width="1200"/);
    expect(svg).toMatch(/<svg[^>]*height="630"/);
  });

  it("uses only token colors and none of the Night Survey palette", () => {
    const allowed = new Set(
      Object.values(tokens)
        .flatMap((v) => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v) : []))
        .filter((v) => typeof v === "string")
        .map((v) => v.toUpperCase()),
    );
    const svg = generateOgSvg("Edward Kubiak");
    const paints = [...svg.matchAll(/\b(?:fill|stroke)="([^"]*)"/g)].map((m) => m[1]);
    expect(paints.length).toBeGreaterThan(0);
    for (const paint of paints) {
      expect(paint === "none" || allowed.has(paint.toUpperCase())).toBe(true);
    }
    const hexes = svg.match(/#[0-9A-Fa-f]{6}\b/g) ?? [];
    expect(hexes.length).toBeGreaterThan(0);
    for (const hex of hexes) expect(allowed.has(hex.toUpperCase())).toBe(true);
    for (const old of NIGHT_SURVEY) expect(svg.toUpperCase()).not.toContain(old.toUpperCase());
  });

  it("escapes the title and still renders a well-formed SVG", async () => {
    expect(escapeXml('A & B <x> "q"')).toBe("A &amp; B &lt;x&gt; &quot;q&quot;");
    const svg = generateOgSvg('A & B <x> "q"', "Project", "PROJECT");
    expect(svg).toContain("A &amp; B &lt;x&gt; &quot;q&quot;");
    const meta = await sharp(Buffer.from(svg)).png().toBuffer().then((b) => sharp(b).metadata());
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });

  it("renders the default subtitle ampersand as a single escape", () => {
    const svg = generateOgSvg("Edward Kubiak");
    expect(svg).toContain("Developer &amp; AI");
    expect(svg).not.toContain("&amp;amp;");
  });

  it("ends every font-family in a generic family", () => {
    const families = [...generateOgSvg("Edward Kubiak").matchAll(/font-family="([^"]+)"/g)].map((m) => m[1]);
    expect(families.length).toBeGreaterThan(0);
    for (const f of families) expect(f).toMatch(/(sans-serif|monospace)$/);
  });

  it("shrinks the headline for long titles", () => {
    expect(headlineSize("CAST — Claude Agent Team")).toBeLessThan(headlineSize("Edward Kubiak"));
  });

  describe("isDirectInvocation", () => {
    it("is false for a missing or unrelated argv[1]", () => {
      expect(isDirectInvocation(undefined, GENERATOR_URL)).toBe(false);
      expect(isDirectInvocation("/nonexistent/other.mjs", GENERATOR_URL)).toBe(false);
    });

    it("is true for the module's own path and for a symlink to it", () => {
      expect(isDirectInvocation(GENERATOR, GENERATOR_URL)).toBe(true);
      const link = path.join(makeTempDir(), "link.mjs");
      fs.symlinkSync(GENERATOR, link);
      expect(isDirectInvocation(link, GENERATOR_URL)).toBe(true);
    });
  });

  describe("CLI (deploy.yml contract)", () => {
    it("sanitises the slug, writes only <slug>.png and exits 0", async () => {
      const outDir = makeTempDir();
      const result = runGenerator(["--slug", "../evil/cast", "--title", "CAST", "--outDir", outDir]);
      expectSuccess(result);
      expect(fs.readdirSync(outDir)).toEqual(["cast.png"]);
      const meta = await sharp(path.join(outDir, "cast.png")).metadata();
      expect([meta.width, meta.height]).toEqual([1200, 630]);
    });

    it("writes nothing when the module is only imported", () => {
      const outDir = makeTempDir();
      // Under `node -e`, argv[1] is "not-the-script", so a guard-less main() would write into outDir.
      const result = spawnNode([
        "--input-type=module",
        "-e",
        `await import(${JSON.stringify(GENERATOR_URL)})`,
        "not-the-script",
        "--outDir",
        outDir,
      ]);
      expectSuccess(result);
      expect(fs.readdirSync(outDir)).toEqual([]);
    });

    it("exits non-zero and writes nothing for a slug that sanitises to empty", () => {
      const outDir = makeTempDir();
      const result = runGenerator(["--slug", "!!!", "--title", "X", "--outDir", outDir]);
      expect(result.error, String(result.error)).toBeUndefined();
      expect(result.status, result.stderr).not.toBe(0);
      expect(fs.readdirSync(outDir)).toEqual([]);
    });
  });
});
