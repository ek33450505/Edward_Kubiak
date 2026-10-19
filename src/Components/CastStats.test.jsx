/**
 * CastStats.test.jsx — date and number formatting of the ecosystem readout.
 * The runtime TZ is pinned west of UTC so a date-only ISO string shifted by a
 * local-time format would show the previous day (the test bites in UTC CI too).
 */
/* global process */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import CastStats from "./CastStats";

vi.mock("../hooks/useStaticJson", () => ({
  useStaticJson: () => ({ data: { updated: "2026-10-15", tests: 4767, version: "v1.2.3" } }),
}));

const originalTZ = process.env.TZ;
beforeAll(() => { process.env.TZ = "America/New_York"; });
afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe("CastStats", () => {
  it("formats a date-only ISO string without a timezone day shift", () => {
    render(<CastStats />);
    expect(screen.getByText(/Updated Oct 15, 2026/)).toBeInTheDocument();
  });

  it("groups thousands in numeric values and leaves strings alone", () => {
    render(<CastStats />);
    expect(screen.getByText("4,767")).toBeInTheDocument();
    expect(screen.getByText("v1.2.3")).toBeInTheDocument();
  });
});
