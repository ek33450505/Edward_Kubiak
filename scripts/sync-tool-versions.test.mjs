import { describe, expect, it } from "vitest";
import { pickLatestSemver } from "./sync-tool-versions.mjs";

describe("pickLatestSemver", () => {
  it("picks the highest semver from v-prefixed tags", () => {
    expect(pickLatestSemver(["v0.1.0", "v0.3.0", "v0.2.0"])).toBe("v0.3.0");
  });

  it("compares numerically, not lexically (1.10 > 1.9)", () => {
    expect(pickLatestSemver(["1.2.0", "v1.10.0", "v1.9.0"])).toBe("v1.10.0");
  });

  it("returns null when no tag matches semver shape", () => {
    expect(pickLatestSemver(["garbage", "main"])).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(pickLatestSemver([])).toBeNull();
  });
});
