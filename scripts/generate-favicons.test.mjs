import { describe, expect, it } from "vitest";
import { spawnSync } from "child_process";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { ACCENT, BACKGROUND, BORDER_STRONG } from "../src/lib/tokens.js";
const GENERATOR = path.resolve(process.cwd(), "scripts/generate-favicons.mjs");
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const ICONS = [
  "favicon.svg",
  "favicon.ico",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
];
const snapshotIcons = () =>
  Object.fromEntries(
    ICONS.map((n) => {
      const f = path.join(PUBLIC_DIR, n);
      return [n, `${fs.statSync(f).mtimeMs}:${fs.readFileSync(f).length}`];
    }),
  );

const { GRID, ICO_SIZES, MASKABLE_SCALE, encodeIco, faviconSvg, glyphBounds, pathPoints, renderPng } = await import(
  "./generate-favicons.mjs"
);

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const VARIANTS = ["tile", "fullbleed", "maskable"];

// Bounding box (pixels) of amber glyph pixels in a rendered SVG.
async function amberBox(svg, size) {
  const { data, info } = await sharp(Buffer.from(svg), { density: (72 * size) / GRID })
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [ar, ag, ab] = [1, 3, 5].map((k) => parseInt(ACCENT.slice(k, k + 2), 16));
  const box = { x0: Infinity, y0: Infinity, x1: -1, y1: -1 };
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (Math.abs(data[i] - ar) + Math.abs(data[i + 1] - ag) + Math.abs(data[i + 2] - ab) < 60) {
        box.x0 = Math.min(box.x0, x);
        box.x1 = Math.max(box.x1, x);
        box.y0 = Math.min(box.y0, y);
        box.y1 = Math.max(box.y1, y);
      }
    }
  }
  expect(box.x1, "no amber pixels found").toBeGreaterThanOrEqual(0);
  return box;
}

const withinCircle = (b, radius) =>
  [
    [b.x0, b.y0],
    [b.x1, b.y0],
    [b.x0, b.y1],
    [b.x1, b.y1],
  ].every(([x, y]) => Math.hypot(x - GRID / 2, y - GRID / 2) <= radius);

describe("faviconSvg", () => {
  it.each(VARIANTS)("%s uses token colors and no text", (variant) => {
    const svg = faviconSvg({ variant });
    expect(svg).toContain(BACKGROUND);
    expect(svg).toContain(ACCENT);
    expect(svg).not.toContain("<text");
    expect(svg).not.toContain("font");
  });

  it("only the tile variant has the frame and rounded corners", () => {
    expect(faviconSvg({ variant: "tile" })).toContain(BORDER_STRONG);
    for (const v of ["fullbleed", "maskable"]) {
      const svg = faviconSvg({ variant: v });
      expect(svg).not.toContain(BORDER_STRONG);
      expect(svg).not.toContain("rx=");
    }
  });

  it("rejects an unknown variant", () => {
    expect(() => faviconSvg({ variant: "nope" })).toThrow();
  });

  it("tile glyph is horizontally centred in the rendered pixels", async () => {
    const box = await amberBox(faviconSvg({ variant: "tile" }), 256);
    expect(Math.abs((box.x0 + box.x1 + 1) / 2 - 128)).toBeLessThanOrEqual(4);
  });

  it("maskable glyph pixels sit inside the 0.4 x size safe circle", async () => {
    const size = 512;
    const box = await amberBox(faviconSvg({ variant: "maskable" }), size);
    const corners = [
      [box.x0, box.y0],
      [box.x1 + 1, box.y0],
      [box.x0, box.y1 + 1],
      [box.x1 + 1, box.y1 + 1],
    ];
    for (const [x, y] of corners) {
      expect(Math.hypot(x - size / 2, y - size / 2)).toBeLessThanOrEqual(0.4 * size);
    }
  });

  it("importing the module leaves the committed icons untouched", () => {
    // A child exits only once its event loop drains, so a guard-less main() finishes writing first.
    const before = snapshotIcons();
    const script = `await import(${JSON.stringify(pathToFileURL(GENERATOR).href)})`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 60_000,
    });
    expect(result.error, String(result.error)).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(snapshotIcons()).toEqual(before);
  });

  it("pathPoints parses K_ARMS-style data and rejects unsupported input", () => {
    expect(pathPoints("M20 14.2 L23.4 9 H26.8 L22.2 16 L26.8 23 H23.4 L20 17.8 Z")).toHaveLength(7);
    expect(() => pathPoints("M0 0 C1 1 2 2 3 3")).toThrow(/Unsupported/);
    expect(() => pathPoints("M0 0 L1 2 3 4")).toThrow(/exactly 2/);
  });

  it("--outDir without a value exits non-zero and writes nothing to public/", () => {
    const before = snapshotIcons();
    const result = spawnSync(process.execPath, [GENERATOR, "--outDir"], { encoding: "utf8", timeout: 60_000 });
    expect(result.error, String(result.error)).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--outDir");
    expect(snapshotIcons()).toEqual(before);
  });

  it("maskable glyph sits inside the 0.4 x size safe circle", () => {
    expect(withinCircle(glyphBounds("maskable"), 0.4 * GRID)).toBe(true);
    expect(MASKABLE_SCALE).toBeLessThan(1);
  });

  it("the safe-zone check rejects an oversized glyph", () => {
    expect(withinCircle(glyphBounds("maskable", 1.1), 0.4 * GRID)).toBe(false);
  });

  it("committed public/favicon.svg matches the generator", () => {
    // import.meta.url is not a file: URL under jsdom, so resolve from the repo root.
    const file = path.resolve(process.cwd(), "public/favicon.svg");
    const committed = fs.readFileSync(file, "utf8").replace(/\n+$/, "");
    expect(committed).toBe(faviconSvg({ variant: "tile" }).replace(/\n+$/, ""));
  });
});

describe("encodeIco", () => {
  it("writes a consistent 16/32/48 container", async () => {
    const svg = faviconSvg({ variant: "tile" });
    const pngs = await Promise.all(ICO_SIZES.map((n) => renderPng(svg, n)));
    const ico = encodeIco(pngs);

    expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 3]);

    let expectedOffset = 6 + 16 * 3;
    ICO_SIZES.forEach((n, i) => {
      const e = 6 + 16 * i;
      expect(ico[e]).toBe(n);
      expect(ico[e + 1]).toBe(n);
      expect(ico.readUInt16LE(e + 4)).toBe(1);
      expect(ico.readUInt16LE(e + 6)).toBe(32);
      const size = ico.readUInt32LE(e + 8);
      const offset = ico.readUInt32LE(e + 12);
      expect(size).toBe(pngs[i].length);
      expect(offset).toBe(expectedOffset);
      expect(ico.subarray(offset, offset + 8).equals(PNG_SIG)).toBe(true);
      expectedOffset += size;
    });
    expect(expectedOffset).toBe(ico.length);
  });

  it("encodes a 256px entry with zero width and height bytes", async () => {
    const png = await renderPng(faviconSvg({ variant: "tile" }), 256);
    const ico = encodeIco([png]);
    expect(ico[6]).toBe(0);
    expect(ico[7]).toBe(0);
    expect(ico.readUInt32LE(6 + 8)).toBe(png.length);
  });
});
