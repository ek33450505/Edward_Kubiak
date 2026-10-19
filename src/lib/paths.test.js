import { describe, expect, it } from "vitest";
import { normalizePath } from "./paths";

describe("normalizePath", () => {
  it.each([
    ["/about/", "/about"],
    ["/about//", "/about"],
    ["/about", "/about"],
    ["/", "/"],
    ["", "/"],
    ["/projects/compute-atlas/", "/projects/compute-atlas"],
    ["/projects/", "/projects"],
  ])("%j -> %j", (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});
