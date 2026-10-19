import { describe, it, expect } from "vitest";
import { stageIndex } from "./stageIndex";

describe("stageIndex", () => {
  const count = 4;
  it.each([
    [0, 0],
    [0.249, 0],
    [0.25, 1],
    [0.999, 3],
    [1, 3],
  ])("progress %s -> stage %s", (v, expected) => {
    expect(stageIndex(v, count)).toBe(expected);
  });
});
