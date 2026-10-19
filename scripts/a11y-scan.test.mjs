import { describe, it, expect } from "vitest";

import { parseArgs } from "./a11y-scan.mjs";

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
