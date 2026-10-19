import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(import.meta.dirname, "..", "public");

describe("committed PDFs are tagged", () => {
  for (const name of ["Edward_Kubiak_Resume.pdf", "CAST_Portfolio_OnePager.pdf"]) {
    it(`${name} has a structure tree, MarkInfo and a language`, () => {
      const raw = readFileSync(join(publicDir, name)).toString("latin1");
      expect(raw).toContain("/StructTreeRoot");
      expect(raw).toContain("/MarkInfo");
      expect(raw).toContain("/Lang");
    });
  }
});
