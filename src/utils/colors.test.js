import { describe, it, expect } from "vitest";
import { colorMap, getColorClasses } from "./colors";

describe("colorMap", () => {
  const knownColors = ["accent", "teal", "violet", "sky", "emerald", "rose"];

  it("exports an entry for every expected color key", () => {
    for (const color of knownColors) {
      expect(colorMap).toHaveProperty(color);
    }
  });

  it.each(knownColors)(
    "%s entry has all required shape keys",
    (color) => {
      const entry = colorMap[color];
      expect(entry).toHaveProperty("bg");
      expect(entry).toHaveProperty("text");
      expect(entry).toHaveProperty("badge");
      expect(entry).toHaveProperty("stat");
      expect(entry).toHaveProperty("spotlight");
      expect(entry).toHaveProperty("border");
    }
  );

  it("accent text class is text-accent-400", () => {
    expect(colorMap.accent.text).toBe("text-accent-400");
  });

  it("violet bg class is bg-violet-400/10", () => {
    expect(colorMap.violet.bg).toBe("bg-violet-400/10");
  });

  it("teal badge combines bg and text", () => {
    expect(colorMap.teal.badge).toBe("bg-teal-400/10 text-teal-400");
  });

  it("sky stat class contains border token", () => {
    expect(colorMap.sky.stat).toContain("border-sky-400");
  });

  it("emerald spotlight is a valid rgba string", () => {
    expect(colorMap.emerald.spotlight).toMatch(/^rgba\(/);
  });

  it("rose border class is border-rose-400/30", () => {
    expect(colorMap.rose.border).toBe("border-rose-400/30");
  });
});

describe("getColorClasses", () => {
  it("returns combined text and bg classes for a known color", () => {
    expect(getColorClasses("violet")).toBe("text-violet-400 bg-violet-400/10");
  });

  it("returns combined text and bg for every known color key", () => {
    for (const [key, entry] of Object.entries(colorMap)) {
      expect(getColorClasses(key)).toBe(`${entry.text} ${entry.bg}`);
    }
  });

  it("falls back to accent classes for an unknown color key", () => {
    expect(getColorClasses("unknown-color")).toBe("text-accent-400 bg-accent-400/10");
  });

  it("falls back to accent classes when called with undefined", () => {
    expect(getColorClasses(undefined)).toBe("text-accent-400 bg-accent-400/10");
  });

  it("returns a string with exactly two space-separated Tailwind classes", () => {
    const result = getColorClasses("sky");
    const parts = result.split(" ");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^text-/);
    expect(parts[1]).toMatch(/^bg-/);
  });
});
