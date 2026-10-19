/**
 * CurrentlyBuilding.test.jsx — live activity vs. the /now fallback.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CurrentlyBuilding from "./CurrentlyBuilding";
import now from "../../data/now";

const hook = vi.hoisted(() => ({ value: {} }));
vi.mock("../../hooks/useGitHubActivity", () => ({ useGitHubActivity: () => hook.value }));

const base = { events: [], lastKnownCommits: [], lastKnownCachedAt: "", loading: false, error: false };
const renderIt = () => render(<MemoryRouter><CurrentlyBuilding /></MemoryRouter>);

describe("CurrentlyBuilding", () => {
  beforeEach(() => { hook.value = base; });

  it("falls back to the first three /now Building items with a link to /now when there is no activity", () => {
    renderIt();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain(now.sections[0].items[0].split(" — ")[0]);
    expect(screen.getByRole("link", { name: /more on \/now/i })).toHaveAttribute("href", "/now");
  });

  it("also falls back when the activity fetch errored", () => {
    hook.value = { ...base, error: true };
    renderIt();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("truncates fallback rows at a whole word", () => {
    renderIt();
    const rows = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(rows.some((t) => t.endsWith("…"))).toBe(true);
    rows.filter((t) => t.endsWith("…")).forEach((t) => {
      const stem = t.slice(0, -1);
      const full = now.sections[0].items.find((i) => i.startsWith(stem));
      expect(full).toBeDefined();
      expect(t.length).toBeLessThanOrEqual(141);
      expect(full.charAt(stem.length)).toMatch(/\s/);
    });
  });

  it("shows last-deploy commits (no /now fallback, no Live badge) when only lastKnownCommits exist", () => {
    hook.value = {
      ...base,
      error: true,
      lastKnownCommits: [{ id: "9", repo: "old-repo", sha: "1234567abc", message: "Old commit" }],
      lastKnownCachedAt: "2026-10-01T00:00:00Z",
    };
    renderIt();
    expect(screen.getByText("Old commit")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /more on \/now/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });

  it("shows the Live badge only with live events", () => {
    renderIt();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });

  it("shows live commits, not the fallback, when events exist", () => {
    hook.value = {
      ...base,
      events: [{ id: "1", repo: "demo-repo", sha: "abcdef1234", message: "Add thing", time: new Date().toISOString() }],
    };
    renderIt();
    expect(screen.getByText("Add thing")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /more on \/now/i })).not.toBeInTheDocument();
  });
});
