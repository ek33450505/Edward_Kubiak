import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CAST_STATS } from "../../data/castStats";
import { ATLAS_STATS } from "../../data/atlasStats";
import projects from "../../data/projects";
import ArchitectureFlow from "./ArchitectureFlow";

const reduced = vi.hoisted(() => ({ value: false }));

vi.mock("motion/react", async () => {
  const actual = await vi.importActual("motion/react");
  return { ...actual, useReducedMotion: () => reduced.value };
});

const renderFlow = () =>
  render(
    <MemoryRouter>
      <ArchitectureFlow />
    </MemoryRouter>,
  );

const citedBy = projects.find((p) => p.slug === "compute-atlas").citedBy;

beforeEach(() => {
  reduced.value = false;
});

describe("ArchitectureFlow", () => {
  it("renders the section heading, a 4-item list and four h3s in order", () => {
    renderFlow();
    expect(screen.getByRole("heading", { level: 2, name: "How it's built" })).toBeInTheDocument();
    const ol = document.querySelector("ol");
    expect(ol.tagName).toBe("OL");
    expect(ol.querySelectorAll(":scope > li")).toHaveLength(4);
    const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["Edward Kubiak", "CAST", "Compute Atlas", "Independent projects"]);
  });

  it("shows figures straight from the feeds", () => {
    renderFlow();
    const cast = screen.getByText("specialist agents").parentElement;
    expect(cast).toHaveTextContent(String(CAST_STATS.agents));
    const text = document.body.textContent;
    expect(text).toContain(CAST_STATS.tests.toLocaleString("en-US"));
    expect(text).toContain(CAST_STATS.version);
    expect(text).toContain(ATLAS_STATS.facilities.toLocaleString("en-US"));
    expect(text).toContain(String(ATLAS_STATS.operationalGw));
    expect(text).toContain(ATLAS_STATS.version);
  });

  it("links the stage titles to their case studies", () => {
    renderFlow();
    expect(screen.getByRole("link", { name: "CAST" })).toHaveAttribute(
      "href",
      "/projects/cast-claude-agent-team",
    );
    expect(screen.getByRole("link", { name: "Compute Atlas" })).toHaveAttribute(
      "href",
      "/projects/compute-atlas",
    );
  });

  it("lists every citedBy entry as a new-tab external link", () => {
    renderFlow();
    expect(citedBy.length).toBeGreaterThan(0);
    for (const c of citedBy) {
      const link = screen.getByRole("link", { name: `${c.name} (opens in new tab)` });
      expect(link).toHaveAttribute("href", c.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(within(link).getByText(c.name)).toBeInTheDocument();
    }
  });

  it("hides the decorative track and dots from assistive tech", () => {
    renderFlow();
    for (const id of ["flow-fill-x", "flow-fill-y"]) {
      expect(screen.getByTestId(id).parentElement).toHaveAttribute("aria-hidden", "true");
    }
    for (const dot of document.querySelectorAll("[data-lit]")) {
      expect(dot).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("lights only the first stage before any scroll", () => {
    renderFlow();
    const lit = [...document.querySelectorAll("[data-lit]")].map((d) => d.dataset.lit);
    expect(lit).toEqual(["true", "false", "false", "false"]);
  });

  it("starts the line undrawn without reduced motion", () => {
    renderFlow();
    expect(screen.getByTestId("flow-fill-x")).toHaveAttribute("data-fill", "scroll");
    expect(screen.getByTestId("flow-fill-y")).toHaveAttribute("data-fill", "scroll");
    expect(screen.getByTestId("flow-fill-x").style.transform).toContain("scaleX(0)");
    expect(screen.getByTestId("flow-fill-y").style.transform).toContain("scaleY(0)");
  });

  it("draws the full line and lights every dot under reduced motion", () => {
    reduced.value = true;
    renderFlow();
    const dots = [...document.querySelectorAll("[data-lit]")];
    expect(dots).toHaveLength(4);
    for (const d of dots) {
      expect(d.dataset.lit).toBe("true");
      expect(d).toHaveClass("text-primary");
    }
    for (const id of ["flow-fill-x", "flow-fill-y"]) {
      const fill = screen.getByTestId(id);
      const t = fill.style.transform;
      // identity (scale 1) is serialised as an empty transform
      expect(["", "none"]).toContain(t);
      expect(t).not.toMatch(/scale[XY]\(/);
      expect(fill).toHaveAttribute("data-fill", "full");
    }
  });
});

describe("ArchitectureFlow feed swap", () => {
  it("follows the CAST feed", async () => {
    vi.resetModules();
    vi.doMock("../../data/castStats", async () => {
      const actual = await vi.importActual("../../data/castStats");
      return {
        ...actual,
        CAST_STATS: { ...CAST_STATS, version: "vX.test", tests: CAST_STATS.tests + 1000 },
      };
    });
    try {
      const { default: Swapped } = await import("./ArchitectureFlow");
      render(
        <MemoryRouter>
          <Swapped />
        </MemoryRouter>,
      );
      const text = document.body.textContent;
      expect(text).toContain("vX.test");
      expect(text).toContain((CAST_STATS.tests + 1000).toLocaleString("en-US"));
      expect(text).not.toContain(CAST_STATS.version);
    } finally {
      vi.doUnmock("../../data/castStats");
    }
  });
});

describe("ArchitectureFlow without the CAST and Compute Atlas projects", () => {
  it("falls back to plain-text h3s with no link", async () => {
    vi.resetModules();
    vi.doMock("../../data/projects", () => ({
      default: [{ slug: "other", citedBy: [] }],
    }));
    try {
      const { default: Bare } = await import("./ArchitectureFlow");
      render(
        <MemoryRouter>
          <Bare />
        </MemoryRouter>,
      );
      for (const name of ["CAST", "Compute Atlas"]) {
        const h3 = screen.getByRole("heading", { level: 3, name });
        expect(within(h3).queryByRole("link")).toBeNull();
      }
    } finally {
      vi.doUnmock("../../data/projects");
    }
  });
});
