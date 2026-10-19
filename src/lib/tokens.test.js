/* global process */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as tokens from "./tokens.js";

// Read from disk: Vite's CSS pipeline would rewrite an `?raw` import.
const indexCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

const channel = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const {
  BACKGROUND,
  FOREGROUND,
  CARD,
  BORDER_STRONG,
  MUTED_FOREGROUND,
  ACCENT,
  STATUS_COLORS,
} = tokens;

const TEXT_COLORS = {
  foreground: FOREGROUND,
  "muted-foreground": MUTED_FOREGROUND,
  primary: ACCENT,
  terra: tokens.TERRA,
  water: tokens.WATER,
  sepia: tokens.SEPIA,
};

describe("text contrast (>= 4.5:1)", () => {
  for (const [name, color] of Object.entries(TEXT_COLORS)) {
    it(`${name} on background`, () => {
      expect(contrast(color, BACKGROUND)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name} on card`, () => {
      expect(contrast(color, CARD)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("primary-foreground on primary", () => {
    expect(contrast(tokens.PRIMARY_FOREGROUND, ACCENT)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("graphic contrast (>= 3:1)", () => {
  for (const [name, color] of Object.entries(STATUS_COLORS)) {
    it(`status-${name} on background`, () => {
      expect(contrast(color, BACKGROUND)).toBeGreaterThanOrEqual(3);
    });
  }

  // border-strong outlines interactive controls, so WCAG 1.4.11 applies.
  it("border-strong on background", () => {
    expect(contrast(BORDER_STRONG, BACKGROUND)).toBeGreaterThanOrEqual(3);
  });
  it("border-strong on card", () => {
    expect(contrast(BORDER_STRONG, CARD)).toBeGreaterThanOrEqual(3);
  });
});

describe("index.css mirrors tokens.js", () => {
  const css = (name) => {
    const m = indexCss.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`));
    expect(m, `--color-${name} missing from index.css`).not.toBeNull();
    return m[1].toUpperCase();
  };

  const mirrors = {
    background: BACKGROUND,
    foreground: FOREGROUND,
    card: CARD,
    "card-foreground": FOREGROUND,
    muted: tokens.MUTED,
    "muted-foreground": MUTED_FOREGROUND,
    primary: ACCENT,
    "primary-foreground": tokens.PRIMARY_FOREGROUND,
    border: tokens.SLATE_700,
    "border-strong": BORDER_STRONG,
    ring: ACCENT,
    terra: tokens.TERRA,
    water: tokens.WATER,
    sepia: tokens.SEPIA,
    "status-operational": STATUS_COLORS.operational,
    "status-construction": STATUS_COLORS.construction,
    "status-permitted": STATUS_COLORS.permitted,
    "status-proposed": STATUS_COLORS.proposed,
    "status-cancelled": STATUS_COLORS.cancelled,
  };

  it("every --color-* in index.css has a mirror entry", () => {
    const declared = [...indexCss.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1]);
    expect(declared.filter((name) => !(name in mirrors))).toEqual([]);
  });

  for (const [name, value] of Object.entries(mirrors)) {
    it(`--color-${name}`, () => {
      expect(css(name)).toBe(value.toUpperCase());
    });
  }
});
