import { describe, it, expect } from "vitest";
import { PLACE, COORDINATES, coordinateOverline } from "./place.js";

describe("place — the survey coordinate", () => {
  it("holds Columbus, Ohio's real coordinates", () => {
    // Columbus, OH: 39.9612 N, 82.9988 W
    expect(PLACE.latitude).toBeCloseTo(39.9612, 4);
    expect(PLACE.longitude).toBeCloseTo(-82.9988, 4);
    expect(PLACE.city).toBe("Columbus");
    expect(PLACE.state).toBe("Ohio");
  });

  it("ROUNDS the longitude rather than truncating it", () => {
    // The regression this guards: 82.9988 was displayed as "82.99°W" in five
    // separate files. Rounded to two places it is 83.00, not 82.99.
    expect(COORDINATES).toBe("39.96°N 83.00°W");
    expect(COORDINATES).not.toContain("82.99");
  });

  it("keeps two decimal places on both components, trailing zeros included", () => {
    expect(COORDINATES).toMatch(/^\d{2}\.\d{2}°N \d{2}\.\d{2}°W$/);
  });

  it("builds the frontispiece overline from the same coordinate", () => {
    expect(coordinateOverline(2026)).toBe(
      "39.96°N 83.00°W · COLUMBUS, OHIO · EDITION 2026"
    );
    expect(coordinateOverline(2026)).toContain(COORDINATES);
  });

  it("defaults the edition to the current year", () => {
    expect(coordinateOverline()).toContain(`EDITION ${new Date().getFullYear()}`);
  });
});
