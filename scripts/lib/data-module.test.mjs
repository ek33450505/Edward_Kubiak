import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { parseDataModule, renderDataModule, jsonStyleOf, renderJsonLike } from "./data-module.mjs";

const dataDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "src", "data");
const MODULES = ["castStats", "atlasStats", "toolStats", "repoFacts", "atlasPoints"];

const sample = `// banner\n\nexport const A_B = {\n  "x": 1\n};\n\nexport const C = [\n  1,\n  2\n];\n`;

describe("data-module", () => {
  it.each(MODULES)("round-trips committed %s.js byte for byte", (name) => {
    const text = fs.readFileSync(path.join(dataDir, `${name}.js`), "utf8");
    const p = parseDataModule(text);
    expect(p.segments.length).toBe(p.exports.length + 1);
    expect(renderDataModule(p.segments, p.exports)).toBe(text);
  });

  it("renders a changed value into the same segments", () => {
    const p = parseDataModule(sample);
    p.exports[0].value.x = 2;
    expect(renderDataModule(p.segments, p.exports)).toBe(sample.replace('"x": 1', '"x": 2'));
  });

  it("throws on mismatched counts", () => {
    const p = parseDataModule(sample);
    expect(() => renderDataModule(p.segments, p.exports.slice(1))).toThrow();
  });

  it("throws on an invalid JSON value", () => {
    expect(() => parseDataModule("export const A = {\n  x: 1\n};\n")).toThrow(/valid JSON/);
  });

  it("throws on a value that does not match JSON.stringify formatting", () => {
    expect(() => parseDataModule('export const A = {"x":1};\n')).toThrow(/round-trip/);
  });

  it("throws when there are no exports", () => {
    expect(() => parseDataModule("// nothing here\n")).toThrow(/no `export const/);
  });

  it("throws on a scalar top-level value", () => {
    expect(() => parseDataModule("export const A = 5;\n")).toThrow(/not an object or array/);
    expect(() => parseDataModule('export const A = "s";\n')).toThrow(/not an object or array/);
  });

  it("throws on raw U+2028, U+2029 or CR anywhere in the text", () => {
    for (const ch of ["\u2028", "\u2029", "\r"]) {
      expect(() => parseDataModule(`// x${ch}y\n${sample}`)).toThrow(/U\+2028/);
    }
  });

  it("throws on a duplicate export name", () => {
    expect(() => parseDataModule('export const A = {\n  "x": 1\n};\nexport const A = {\n  "x": 2\n};\n')).toThrow(
      /duplicate export A/,
    );
  });

  it("throws on an own __proto__ key at any depth", () => {
    expect(() => parseDataModule('export const A = {\n  "__proto__": 1\n};\n')).toThrow(/__proto__/);
    expect(() => parseDataModule('export const A = {\n  "a": [\n    {\n      "__proto__": {}\n    }\n  ]\n};\n')).toThrow(
      /__proto__/,
    );
  });

  // The check the later gate runs: parse succeeds, export NAMES match in order, and the
  // candidate equals the original's segments rendered with the candidate's values.
  function gateAccepts(original, candidate, { checkNames = true } = {}) {
    try {
      const o = parseDataModule(original);
      const c = parseDataModule(candidate);
      if (checkNames && o.exports.map((e) => e.name).join() !== c.exports.map((e) => e.name).join()) return false;
      return renderDataModule(o.segments, c.exports) === candidate;
    } catch {
      return false;
    }
  }

  describe("gateAccepts", () => {
    const original = fs.readFileSync(path.join(dataDir, "castStats.js"), "utf8");
    const lastEnd = original.lastIndexOf("};") + 2;
    const firstEnd = original.indexOf("};") + 2;

    it("accepts an honest value change", () => {
      expect(gateAccepts(original, original)).toBe(true);
      const changed = original.replace(/"tests": \d+/, '"tests": 1');
      expect(changed).not.toBe(original);
      expect(gateAccepts(original, changed)).toBe(true);
    });

    it.each([
      ["banner line with U+2028 and an export", original.replace(/\n/, "\n// x\u2028export const EVIL = 1;\n")],
      ["code after the last export", original.slice(0, lastEnd) + "\nalert(1);\n" + original.slice(lastEnd)],
      [
        "extra export between two exports",
        original.slice(0, firstEnd) + '\nexport const EXTRA = {"a": 1};\n' + original.slice(firstEnd),
      ],
    ])("rejects tamper: %s", (_label, tampered) => {
      expect(tampered).not.toBe(original);
      expect(gateAccepts(original, tampered)).toBe(false);
    });

    it("the render comparison alone still rejects an extra export (name check skipped)", () => {
      const tampered = original.slice(0, firstEnd) + '\nexport const EXTRA = {"a": 1};\n' + original.slice(firstEnd);
      expect(gateAccepts(original, tampered, { checkNames: false })).toBe(false);
    });
  });
});

describe("jsonStyleOf / renderJsonLike", () => {
  const publicDir = path.resolve(dataDir, "..", "..", "public");
  const FEEDS = ["cast-stats", "atlas-stats", "tool-versions", "repo-facts", "atlas-points", "last-known-commits"];

  it.each(FEEDS)("round-trips committed public/%s.json byte for byte", (name) => {
    const text = fs.readFileSync(path.join(publicDir, `${name}.json`), "utf8");
    expect(renderJsonLike(JSON.parse(text), jsonStyleOf(text))).toBe(text);
  });

  it("detects compact vs pretty and the trailing newline", () => {
    expect(jsonStyleOf('{"a":1}')).toEqual({ pretty: false, trailingNewline: false });
    expect(jsonStyleOf('{\n  "a": 1\n}\n')).toEqual({ pretty: true, trailingNewline: true });
  });
});
